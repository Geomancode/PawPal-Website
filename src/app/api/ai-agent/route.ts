// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PawPal Web AI Agent — API Route (SSE streaming + Persona + Memory)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/ai-agent
// Body: { message, history?, userId? }
// Response: text/event-stream (SSE)
//
// When userId is provided:
//   → Load pets → pick random sibling → inject persona + memories
// When no userId:
//   → Use fallback PawPal identity

import { NextRequest } from "next/server";
import { GoogleGenAI, createPartFromFunctionResponse } from "@google/genai";
import { PLATFORM_KNOWLEDGE_PROMPT, FALLBACK_IDENTITY_PROMPT } from "./systemPrompt";
import { loadUserPets, pickRandom, recallMemories, buildPersonaPrompt } from "./personaEngine";
import { toolDeclarations, executeTool } from "./tools";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MAX_TOOL_LOOPS = 6;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message;
    const history: HistoryMessage[] = body.history ?? [];
    const userId: string | null = body.userId ?? null;

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
          // ── Subscription gate ─────────────────────────────────────
          if (!userId) {
            send("error", { message: "🔒 Please sign in to use PawPal AI." });
            return;
          }

          // Check subscription tier
          const { data: profile } = await (await import("@/lib/supabaseServer")).supabaseServer
            .from("profiles")
            .select("subscription_tier")
            .eq("id", userId)
            .single();

          const tier = (profile?.subscription_tier as string) ?? "free";
          if (tier === "free") {
            send("error", {
              message: "🐾 PawPal AI is a subscriber-only feature!\n\nUpgrade to Basic or Pro to unlock your pet's digital companion. 💬",
            });
            return;
          }

          // ── Build system prompt (persona or fallback) ──────────────
          let systemPrompt: string;
          let activePetName: string | null = null;
          let activePetSpecies: string | null = null;

          const pets = await loadUserPets(userId);
          if (pets.length > 0) {
            const activePet = pickRandom(pets);
            activePetName = activePet.petName;
            activePetSpecies = activePet.speciesGroup;

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
            activePetName = "PawPal";
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
              response = await chat.sendMessage({ message: message.trim() });
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
