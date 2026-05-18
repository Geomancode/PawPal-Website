// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PawPal Web AI Agent — API Route (SSE streaming + Persona + Memory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/ai-agent
// Body: { message, history? }
// Optional auth: Authorization: Bearer <Supabase access token>
// Response: text/event-stream (SSE)
//
// When a verified user session is provided:
//   → Load pets → pick random sibling → inject persona + memories
// When no verified session exists:
//   → Use fallback PawPal identity

import { NextRequest } from "next/server";
import { GoogleGenAI, createPartFromFunctionResponse } from "@google/genai";
import { supabaseServer } from "@/lib/supabaseServer";
import { PLATFORM_KNOWLEDGE_PROMPT, FALLBACK_IDENTITY_PROMPT, FREE_TIER_QA_PROMPT } from "./systemPrompt";
import { loadUserPets, pickRandom, recallMemories, buildPersonaPrompt } from "./personaEngine";
import { toolDeclarations, executeTool } from "./tools";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MAX_TOOL_LOOPS = 6;
const MAX_MESSAGE_CHARS = 1200;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CONTENT_CHARS = 1000;
const RATE_WINDOW_MS = 60_000;
const ANON_RATE_LIMIT = 6;
const USER_RATE_LIMIT = 18;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

// Tool display labels (for UI badges)
const TOOL_LABELS: Record<string, string> = {
  search_places: "🔍 Searching nearby places…",
  search_missions: "🐾 Searching missions…",
  check_food_safety: "🍎 Checking food safety…",
  breed_encyclopedia: "📖 Looking up breed info…",
};

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

function sanitizeHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is HistoryMessage => {
      if (!m || typeof m !== "object") return false;
      const candidate = m as Partial<HistoryMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, MAX_HISTORY_CONTENT_CHARS),
    }));
}

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function takeRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

async function resolveUserId(req: NextRequest): Promise<{ userId: string | null; invalidToken: boolean }> {
  const token = getBearerToken(req);
  if (!token) return { userId: null, invalidToken: false };
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error) return { userId: null, invalidToken: true };
  return { userId: data.user?.id ?? null, invalidToken: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = sanitizeHistory(body.history);

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Empty message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      return new Response(
        JSON.stringify({ error: `Message is too long. Keep it under ${MAX_MESSAGE_CHARS} characters.` }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const { userId, invalidToken } = await resolveUserId(req);
    if (invalidToken) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const rateKey = userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
    if (!takeRateLimit(rateKey, userId ? USER_RATE_LIMIT : ANON_RATE_LIMIT)) {
      return new Response(
        JSON.stringify({ error: "Too many AI requests. Please wait a minute and try again." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // ── Determine subscription tier ────────────────────────────
          let tier = "free";

          if (userId) {
            const { data: profile } = await supabaseServer
              .from("profiles")
              .select("subscription_tier")
              .eq("id", userId)
              .single();
            tier = (profile?.subscription_tier as string) ?? "free";
          }

          // ── Free tier / not logged in → lightweight Q&A (no tools, no persona) ──
          if (!userId || tier === "free") {
            send("thinking", {});
            send("persona", { petName: "PawPal", speciesGroup: null, status: "alive", siblingCount: 0, memoriesRecalled: 0 });

            const freeAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
            let freeResp;
            let freeErr: unknown = null;

            const freeHistory = history.map((m) => ({
              role: m.role === "assistant" ? "model" as const : "user" as const,
              parts: [{ text: m.content }],
            }));

            for (const model of MODELS) {
              try {
                const freeChat = freeAi.chats.create({
                  model,
                  config: {
                    systemInstruction: FREE_TIER_QA_PROMPT,
                    temperature: 0.7,
                    maxOutputTokens: 512,
                  },
                  history: freeHistory.length > 0 ? freeHistory : undefined,
                });
                freeResp = await freeChat.sendMessage({ message });
                freeErr = null;
                break;
              } catch (e) {
                freeErr = e;
                const msg = e instanceof Error ? e.message : String(e);
                if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("RESOURCE_EXHAUSTED")) break;
              }
            }

            if (freeErr || !freeResp) {
              send("error", { message: "🔄 Service temporarily busy. Please try again!" });
            } else {
              const text = freeResp.text ?? "";
              if (text) {
                // Append a subtle upsell hint for free users
                const upsellHint = !userId
                  ? "\n\n💡 _Sign in to unlock map search with AI pins!_"
                  : "\n\n✨ _Upgrade to Pro for personalized AI with your pet's personality!_";
                send("text", { content: text + upsellHint });
              }
            }
            send("done", {});
            return;
          }

          // ── Build system prompt (persona or fallback) ──────────────
          let systemPrompt: string;

          const pets = await loadUserPets(userId);
          if (pets.length > 0) {
            const activePet = pickRandom(pets);

            const memories = await recallMemories(activePet.petId);
            const personaPrompt = buildPersonaPrompt(activePet, pets, memories);
            systemPrompt = `${personaPrompt}\n\n${PLATFORM_KNOWLEDGE_PROMPT}`;

            // Tell the UI which pet "picked up the phone"
            send("persona", {
              petName: activePet.petName,
              speciesGroup: activePet.speciesGroup,
              status: activePet.status,
              siblingCount: pets.length,
              memoriesRecalled: memories.length,
            });
          } else {
            // Subscriber but no pets — use "PawPal" identity
            send("persona", { petName: "PawPal", speciesGroup: null, status: "alive", siblingCount: 0, memoriesRecalled: 0 });
            systemPrompt = `${FALLBACK_IDENTITY_PROMPT}\n\n${PLATFORM_KNOWLEDGE_PROMPT}`;
          }

          // ── Initialize Gemini ────────────────────────────────────────
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

          // Build chat history from previous messages
          const geminiHistory = history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));

          const chatConfig = {
            config: {
              systemInstruction: systemPrompt,
              tools: [{ functionDeclarations: toolDeclarations }],
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
            history: geminiHistory.length > 0 ? geminiHistory : undefined,
          };

          // Try primary model, fallback on 503/quota errors
          const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
          let chat;
          let response;
          let lastErr: unknown = null;

          send("thinking", {});

          for (const model of MODELS) {
            try {
              chat = ai.chats.create({ model, ...chatConfig });
              response = await chat.sendMessage({ message });
              lastErr = null;
              break; // Success — stop trying models
            } catch (modelErr) {
              lastErr = modelErr;
              const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
              console.warn(`[ai-agent] Model ${model} failed:`, msg.substring(0, 120));
              // Only retry on 503/quota/unavailable — not on other errors
              if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("RESOURCE_EXHAUSTED") && !msg.includes("quota")) {
                break; // Non-retryable error → stop
              }
            }
          }

          if (lastErr || !response || !chat) {
            throw lastErr ?? new Error("All models unavailable");
          }

          // ── Tool-call loop (mirrors agent_service.dart) ───────────────
          let loops = 0;

          while (
            response.functionCalls &&
            response.functionCalls.length > 0 &&
            loops < MAX_TOOL_LOOPS
          ) {
            loops++;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const functionResponses: any[] = [];

            for (const call of response.functionCalls) {
              // Emit tool_call event for UI badge
              send("tool_call", {
                tool: call.name,
                label: TOOL_LABELS[call.name!] || `🔧 ${call.name}…`,
              });

              // Execute tool
              let result: Record<string, unknown>;
              try {
                result = await executeTool(
                  call.name!,
                  (call.args as Record<string, unknown>) ?? {}
                );
              } catch (e) {
                result = { error: `Tool execution failed: ${e}` };
              }

              // Emit tool_result for UI rich cards
              send("tool_result", {
                tool: call.name,
                data: result,
              });

              // Build function response to send back to Gemini
              functionResponses.push(
                createPartFromFunctionResponse(
                  call.id ?? "",
                  call.name!,
                  result,
                )
              );
            }

            // Feed all tool results back to the model
            response = await chat.sendMessage({
              message: functionResponses,
            });
          }

          // ── Extract final text response ─────────────────────────────
          const text = response.text ?? "";
          if (text) {
            send("text", { content: text });
          }

          send("done", {});
        } catch (e) {
          // Log raw error for debugging
          const rawMsg = e instanceof Error ? e.message : String(e);
          console.error("[ai-agent] Gemini error:", rawMsg);
          // Parse user-friendly error message
          let friendlyMsg = "Sorry, I couldn't process that right now. Please try again!";
          if (rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota")) {
            friendlyMsg = "🔄 The AI service is temporarily at capacity. Please wait a moment and try again.";
          } else if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE")) {
            friendlyMsg = "🔄 The AI service is experiencing high demand. Please try again in a few seconds.";
          } else if (rawMsg.includes("INVALID_API_KEY") || rawMsg.includes("API_KEY")) {
            friendlyMsg = "⚠️ AI service configuration issue. Please contact support.";
          } else if (rawMsg.includes("timeout") || rawMsg.includes("DEADLINE")) {
            friendlyMsg = "⏱️ The request took too long. Please try a shorter question.";
          }
          send("error", { message: friendlyMsg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
