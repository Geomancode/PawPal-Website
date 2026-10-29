import { NextRequest, NextResponse } from "next/server";
import { supabaseServer as supabase, createUserScopedSupabaseClient } from "@/lib/supabaseServer";
import { getOwnProfile } from "@/lib/profileViews";
import { hasAiAccess } from "@/lib/subscriptions";
import {
  buildOrIlikeContainsFilter,
  parseSearchPagination,
  sanitizeSearchQuery,
  searchRange,
  type SearchPagination,
} from "@/lib/searchQuery";

// Match the existing paid AI entry: 1200 UTF-16 units and 18 requests/minute.
// This is an instance-local request limit, not a distributed billing quota.
const MAX_QUERY_CHARS = 1200;
const RATE_WINDOW_MS = 60_000;
const USER_RATE_LIMIT = 18;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function takeRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || bucket.resetAt <= now) {
    // Remove expired entries without evicting another account's active limit.
    for (const [key, entry] of rateBuckets) {
      if (entry.resetAt <= now) rateBuckets.delete(key);
    }
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= USER_RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

function searchJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  : null;
const EMPTY_SEARCH_MESSAGE =
  "No search results yet. Try a pet place, mission type, or a broader keyword.";

async function geminiChat(prompt: string): Promise<string | null> {
  if (!GEMINI_URL) return null;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function searchSupabase(query: string, pagination: SearchPagination) {
  const filter = buildOrIlikeContainsFilter(["title", "quest_type"], query);
  if (!filter) return [];
  const range = searchRange(pagination);
  const { data, error } = await supabase
    .from("quests")
    .select("id,title,quest_type,status,reward_type,lat,lng")
    .or(filter)
    .range(range.from, range.to);
  if (error) return [];
  return data ?? [];
}

async function searchPlaces(query: string, pagination: SearchPagination) {
  const filter = buildOrIlikeContainsFilter(
    ["name", "place_type", "city"],
    query
  );
  if (!filter) return [];
  const range = searchRange(pagination);
  const { data, error } = await supabase
    .from("places")
    .select("id,name,place_type,lat,lng,city,rating_avg")
    .or(filter)
    .range(range.from, range.to);
  if (error) return [];
  return data ?? [];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return searchJson({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return searchJson({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = body as { query?: unknown; limit?: unknown; offset?: unknown; page?: unknown };
  const { query } = payload;
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return searchJson({ error: "Empty query" }, { status: 400 });
  }

  const q = query.trim();
  if (q.length > MAX_QUERY_CHARS) {
    return searchJson({ error: `Search query is too long. Keep it under ${MAX_QUERY_CHARS} characters.` }, { status: 413 });
  }

  const bearer = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!bearer) {
    return searchJson({ error: "Sign in and upgrade to Basic or Pro to use PawPal AI.", upgradeRequired: true }, { status: 401 });
  }
  const accessToken = bearer[1];
  let userId: string;
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return searchJson({ error: "Invalid session" }, { status: 401 });
    }
    userId = data.user.id;
  } catch {
    return searchJson({ error: "Unable to verify the session. Please try again later." }, { status: 503 });
  }

  let aiAccess = false;
  try {
    const profile = await getOwnProfile(createUserScopedSupabaseClient(accessToken), userId);
    aiAccess = hasAiAccess(profile ?? {});
  } catch {
    // Missing, failed or mismatched permission envelopes never grant paid AI.
    aiAccess = false;
  }
  if (!aiAccess) {
    return searchJson({ error: "PawPal AI requires an active Basic or Pro plan.", upgradeRequired: true }, { status: 402 });
  }
  if (!takeRateLimit(userId)) {
    return searchJson({ error: "Too many AI requests. Please wait a minute and try again." }, { status: 429 });
  }

  const safeQuery = sanitizeSearchQuery(q);
  const pagination = parseSearchPagination(payload);
  if (!safeQuery) {
    return searchJson({
      intent: "empty",
      results: [],
      aiMessage: EMPTY_SEARCH_MESSAGE,
      pagination,
    });
  }

  // Phase 1: Ask Gemini to classify intent
  const classifyPrompt = `You are PawPal's AI assistant — a helpful, friendly expert on pets and animal welfare.
The user typed this in a search box on a world map showing pet missions and pet-friendly places:
"${q}"

Classify the user's intent into ONE of these categories:
- "search_missions" — looking for pet tasks, quests, volunteer jobs
- "search_places" — looking for vets, dog parks, pet shops, shelters, groomers
- "pet_question" — asking a general question about pets, breeds, care, training, health
- "general" — anything else (greeting, off-topic)

Also extract relevant search keywords (in English) if the intent is search.

Reply ONLY as compact JSON:
{"intent":"search_places","keywords":"dog park","language":"en"}`;

  const intentRaw = await geminiChat(classifyPrompt);
  let intent = "general";
  let keywords = q;
  try {
    if (intentRaw) {
      const cleaned = intentRaw.replace(/```(?:json)?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        intent = parsed.intent || "general";
        keywords = parsed.keywords || q;
      }
    }
  } catch { /* fallback */ }

  // Phase 2: Based on intent, fetch data or generate AI response
  if (intent === "search_missions") {
    const quests = await searchSupabase(keywords, pagination);
    // Also try broader text search with original query
    const quests2 = keywords !== q ? await searchSupabase(q, pagination) : [];
    const all = dedup([...quests, ...quests2]).slice(0, pagination.limit);
    return searchJson({ intent, results: all, aiMessage: all.length > 0 ? `Found ${all.length} mission(s) matching "${q}".` : `No missions found for "${q}". Try a broader search!`, pagination });
  }

  if (intent === "search_places") {
    const places = await searchPlaces(keywords, pagination);
    const places2 = keywords !== q ? await searchPlaces(q, pagination) : [];
    const all = dedup([...places, ...places2]).slice(0, pagination.limit);
    return searchJson({ intent, results: all, aiMessage: all.length > 0 ? `Found ${all.length} place(s) matching "${q}".` : `No places found for "${q}". Try a different keyword!`, pagination });
  }

  if (intent === "pet_question") {
    const aiAnswer = await geminiChat(
      `You are PawPal AI — a friendly, knowledgeable pet expert assistant embedded in a web map app for pet lovers globally. 
Keep answers concise (3-5 sentences max), helpful, and warm. Use emojis sparingly.
If the question relates to emergencies, always recommend seeing a vet.

User question: "${q}"

Answer in the same language the user used:`
    );
    return searchJson({ intent, results: [], aiMessage: aiAnswer || "Sorry, I couldn't process that question right now. Please try again!" });
  }

  // General / fallback
  const aiAnswer = await geminiChat(
    `You are PawPal AI — a friendly assistant embedded in a pet community web app.
The user typed: "${q}"
Respond briefly and helpfully (2-3 sentences). If they're greeting you, greet back warmly and suggest what they can search for (missions, places, pet questions).
Answer in the same language the user used:`
  );
  return searchJson({ intent, results: [], aiMessage: aiAnswer || "Hi! 🐾 Try searching for pet missions, places, or ask me any pet question!" });
}

function dedup<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
