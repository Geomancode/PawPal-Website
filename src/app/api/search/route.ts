import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function geminiChat(prompt: string): Promise<string | null> {
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

async function searchSupabase(table: string, query: string, fields: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${fields}&or=(title.ilike.%25${encodeURIComponent(query)}%25,quest_type.ilike.%25${encodeURIComponent(query)}%25)&limit=10`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

async function searchPlaces(query: string) {
  const url = `${SUPABASE_URL}/rest/v1/places?select=id,name,place_type,lat,lng,city,rating_avg&or=(name.ilike.%25${encodeURIComponent(query)}%25,place_type.ilike.%25${encodeURIComponent(query)}%25,city.ilike.%25${encodeURIComponent(query)}%25)&limit=10`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Empty query" }, { status: 400 });
  }

  const q = query.trim();

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
    const quests = await searchSupabase("quests", keywords, "id,title,quest_type,status,reward_type,lat,lng");
    // Also try broader text search with original query
    const quests2 = keywords !== q ? await searchSupabase("quests", q, "id,title,quest_type,status,reward_type,lat,lng") : [];
    const all = dedup([...quests, ...quests2]);
    return NextResponse.json({ intent, results: all, aiMessage: all.length > 0 ? `Found ${all.length} mission(s) matching "${q}".` : `No missions found for "${q}". Try a broader search!` });
  }

  if (intent === "search_places") {
    const places = await searchPlaces(keywords);
    const places2 = keywords !== q ? await searchPlaces(q) : [];
    const all = dedup([...places, ...places2]);
    return NextResponse.json({ intent, results: all, aiMessage: all.length > 0 ? `Found ${all.length} place(s) matching "${q}".` : `No places found for "${q}". Try a different keyword!` });
  }

  if (intent === "pet_question") {
    const aiAnswer = await geminiChat(
      `You are PawPal AI — a friendly, knowledgeable pet expert assistant embedded in a web map app for pet lovers globally. 
Keep answers concise (3-5 sentences max), helpful, and warm. Use emojis sparingly.
If the question relates to emergencies, always recommend seeing a vet.

User question: "${q}"

Answer in the same language the user used:`
    );
    return NextResponse.json({ intent, results: [], aiMessage: aiAnswer || "Sorry, I couldn't process that question right now. Please try again!" });
  }

  // General / fallback
  const aiAnswer = await geminiChat(
    `You are PawPal AI — a friendly assistant embedded in a pet community web app.
The user typed: "${q}"
Respond briefly and helpfully (2-3 sentences). If they're greeting you, greet back warmly and suggest what they can search for (missions, places, pet questions).
Answer in the same language the user used:`
  );
  return NextResponse.json({ intent, results: [], aiMessage: aiAnswer || "Hi! 🐾 Try searching for pet missions, places, or ask me any pet question!" });
}

function dedup(arr: any[]) {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
