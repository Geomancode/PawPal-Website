// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PawPal Web — Smart Map Search API (mirrors Flutter GeminiSearchService)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/map-search
// Body: { query, lat?, lng? }
// Response: JSON array of SearchResult objects
//
// 5-phase hybrid search pipeline:
//   1. Gemini — intent extraction + language detection + fuzzy semantic mapping
//   2a. Google Places API (New) — POI search
//   2b. Overpass / OSM — complementary POI search
//   2c. Supabase quests — community mission search
//   3. Merge + geographic deduplication
//   4. Gemini — semantic relevance ranking
//   5. Gemini — batch bilingual translation
//
// NO SUBSCRIPTION REQUIRED — open to all users.

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GOOGLE_PLACES_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_API_KEY || "";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  originalName: string;
  localizedName?: string;
  lat: number;
  lng: number;
  zoom: number;
  description?: string;
  relevance: "low" | "general" | "likely" | "specialist";
  relevanceReason?: string;
  source: "google" | "osm" | "nominatim" | "quest";
  placeId?: string;
  rating?: number;
  questType?: string;
}

interface Intent {
  userLanguage: string;
  searchType: "places" | "missions" | "both";
  questType: string;
  city: string;
  osmKey: string;
  osmValue: string;
  specificFilter: string;
  googleTextQuery: string;
  fallbackQuery: string;
  zoom: number;
}

// ── Language map (26 languages) ──────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  en: "English", nl: "Dutch", fr: "French", de: "German",
  es: "Spanish", it: "Italian", pt: "Portuguese", pl: "Polish",
  ro: "Romanian", hu: "Hungarian", cs: "Czech", el: "Greek",
  sv: "Swedish", bg: "Bulgarian", hr: "Croatian", da: "Danish",
  et: "Estonian", fi: "Finnish", ga: "Irish", lv: "Latvian",
  lt: "Lithuanian", mt: "Maltese", sk: "Slovak", sl: "Slovenian",
  zh: "Chinese (Simplified)", ar: "Arabic",
  ja: "Japanese", ko: "Korean", tr: "Turkish",
};

// ── Quest emoji ──────────────────────────────────────────────────────────────

const QUEST_EMOJI: Record<string, string> = {
  walk: "🚶", care: "💊", foster: "🏠", transport: "🚗",
  vet_accompany: "🏥", knowledge: "📚", share: "🤝", skill: "✂️",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query?.trim() ?? "";
    const userLat: number | null = body.lat ?? null;
    const userLng: number | null = body.lng ?? null;

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Phase 1: Intent extraction
    const intent = await extractIntent(query, userLat, userLng);

    let candidates: SearchResult[] = [];

    // Phase 2a + 2b: Places search
    if (intent.searchType === "places" || intent.searchType === "both") {
      const [googleResults, osmResults] = await Promise.all([
        googlePlacesSearch(intent, userLat, userLng),
        overpassSearch(intent, userLat, userLng),
      ]);
      candidates = mergeResults(googleResults, osmResults);

      // Nominatim fallback
      if (candidates.length === 0) {
        candidates = await nominatimSearch(intent.fallbackQuery, intent.zoom);
      }
    }

    // Phase 2c: Quest search
    if (intent.searchType === "missions" || intent.searchType === "both") {
      const quests = await questSearch(intent, userLat, userLng);
      candidates = [...candidates, ...quests];
    }

    // Phase 3: Semantic ranking
    if (candidates.length > 0 && intent.specificFilter) {
      candidates = await rankResults(candidates, intent.specificFilter);
      candidates.sort((a, b) => {
        const order = { specialist: 3, likely: 2, general: 1, low: 0 };
        return (order[b.relevance] ?? 0) - (order[a.relevance] ?? 0);
      });
    }

    // Phase 4: Bilingual translation
    if (candidates.length > 0 && intent.userLanguage && intent.userLanguage !== "nl") {
      candidates = await translateBatch(candidates, intent.userLanguage);
    }

    return NextResponse.json({ results: candidates.slice(0, 15) });
  } catch (e) {
    console.error("[map-search] Error:", e);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 1: Intent extraction (Gemini)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function extractIntent(query: string, lat: number | null, lng: number | null): Promise<Intent> {
  const locHint = lat != null && lng != null
    ? `User GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Ghent / Flanders, Belgium).`
    : "Location not available (assume Ghent area, Belgium).";

  const prompt = `You are a semantic map search engine for PawPal, a pet community app in Belgium.
${locHint}
User query (may be ANY of 26 languages — EU languages + Chinese + Arabic): "${query}"

Tasks:
1. Detect the user's language (ISO 639-1 code)
2. Understand the INTENT behind the query — even if vague or emotional
3. Decide what to search: "places" (locations), "missions" (community quests), or "both"
4. If missions: identify quest_type from: walk, care, foster, transport, vet_accompany, knowledge, share, skill
5. For places: identify the best OSM tag and Google Places query
6. Extract city/area if mentioned; leave empty if not

=== FUZZY SEMANTIC MAPPING ===
Users often express needs indirectly. Map their intent:
- "my dog is sick / 我的狗不舒服 / mijn hond is ziek" → vet (amenity=veterinary)
- "I want to help walk dogs / 帮忙遛狗" → missions: quest_type=walk
- "find friends for my dog / 给狗找朋友" → both: dog_park + missions(walk)
- "pet-friendly hotel / 宠物友好酒店" → places: tourism=hotel + specific_filter=pet-friendly
- "where to swim with my dog / 带狗游泳" → places: leisure=dog_park + natural water areas
- "emergency vet / noodgevallen dierenarts" → vet with 24h filter
- "I can foster a cat / 我可以寄养猫" → missions: quest_type=foster
- "training for aggressive dog" → places: dog training center
- "cheap pet food nearby" → places: shop=pet

=== OSM TAG REFERENCE ===
- Vet / animal hospital → amenity=veterinary
- Dog park / off-leash → leisure=dog_park
- Pet shop → shop=pet
- Animal boarding / kennel → amenity=animal_boarding
- Dog-friendly cafe → amenity=cafe
- Park → leisure=park
- Hotel → tourism=hotel
- Nature reserve → leisure=nature_reserve

Return ONLY compact JSON (no markdown):
{"user_language":"cs","search_type":"places","quest_type":"","city":"","osm_key":"tourism","osm_value":"hotel","specific_filter":"pet-friendly","google_text_query":"pet-friendly hotel Ghent Belgium","fallback_query":"pet hotel Gent","zoom":14}`;

  try {
    const json = await geminiPost(prompt, 280);
    if (json) {
      return {
        userLanguage: String(json.user_language ?? "nl").trim().toLowerCase(),
        searchType: String(json.search_type ?? "places").trim().toLowerCase() as Intent["searchType"],
        questType: String(json.quest_type ?? "").trim(),
        city: String(json.city ?? "").trim(),
        osmKey: String(json.osm_key ?? "amenity").trim(),
        osmValue: String(json.osm_value ?? "").trim(),
        specificFilter: String(json.specific_filter ?? "").trim(),
        googleTextQuery: String(json.google_text_query ?? query).trim(),
        fallbackQuery: String(json.fallback_query ?? query).trim(),
        zoom: Number(json.zoom ?? 14),
      };
    }
  } catch (e) {
    console.error("[map-search] Intent extraction failed:", e);
  }

  return {
    userLanguage: "nl", searchType: "places", questType: "",
    city: "", osmKey: "amenity", osmValue: "veterinary",
    specificFilter: "", googleTextQuery: query, fallbackQuery: query, zoom: 14,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 2a: Google Places API (New)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function googlePlacesSearch(intent: Intent, lat: number | null, lng: number | null): Promise<SearchResult[]> {
  if (!GOOGLE_PLACES_KEY) return [];

  try {
    const body: Record<string, unknown> = {
      textQuery: intent.googleTextQuery,
      maxResultCount: 12,
      languageCode: "nl",
    };

    if (lat != null && lng != null) {
      body.locationBias = {
        circle: { center: { latitude: lat, longitude: lng }, radius: 8000 },
      };
    } else {
      body.locationBias = {
        circle: { center: { latitude: 51.0543, longitude: 3.7174 }, radius: 20000 },
      };
    }

    const resp = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.formattedAddress,places.rating,places.id",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    if (resp.ok) {
      const data = await resp.json();
      return (data.places ?? [])
        .map((p: Record<string, unknown>): SearchResult | null => {
          const name = (p.displayName as Record<string, string>)?.text ?? "";
          const loc = p.location as Record<string, number> | undefined;
          const pLat = loc?.latitude ?? 0;
          const pLng = loc?.longitude ?? 0;
          if (!name || pLat === 0) return null;
          return {
            originalName: name,
            lat: pLat, lng: pLng, zoom: intent.zoom,
            description: p.formattedAddress as string | undefined,
            relevance: "general", source: "google",
            placeId: p.id as string | undefined,
            rating: (p.rating as number) ?? undefined,
          };
        })
        .filter(Boolean) as SearchResult[];
    }
  } catch (e) {
    console.error("[map-search] Google Places error:", e);
  }
  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 2b: Overpass / OSM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function overpassSearch(intent: Intent, lat: number | null, lng: number | null): Promise<SearchResult[]> {
  if (!intent.osmKey || !intent.osmValue) return [];

  // Build bounding box (~7km around user or Ghent center)
  const cLat = lat ?? 51.0543;
  const cLng = lng ?? 3.7174;
  const d = 0.07;
  const s = cLat - d, w = cLng - d, n = cLat + d, e = cLng + d;

  const tag = `"${intent.osmKey}"="${intent.osmValue}"`;
  const q = `[out:json][timeout:20];(node[${tag}](${s},${w},${n},${e});way[${tag}](${s},${w},${n},${e}););out center 20;`;

  try {
    const resp = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(q)}`,
      signal: AbortSignal.timeout(20000),
    });

    if (resp.ok) {
      const data = await resp.json();
      return (data.elements ?? [])
        .map((el: Record<string, unknown>): SearchResult | null => {
          const tags = (el.tags ?? {}) as Record<string, string>;
          const name = tags.name ?? tags["name:nl"] ?? tags["name:en"] ?? toLabel(intent.osmValue);
          const eLat = (el.lat as number) ?? (el.center as Record<string, number>)?.lat ?? 0;
          const eLng = (el.lon as number) ?? (el.center as Record<string, number>)?.lon ?? 0;
          if (eLat === 0) return null;
          return {
            originalName: name, lat: eLat, lng: eLng, zoom: intent.zoom,
            description: tags.description ?? tags.species,
            relevance: "general", source: "osm",
          };
        })
        .filter(Boolean) as SearchResult[];
    }
  } catch (err) {
    console.error("[map-search] Overpass error:", err);
  }
  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 2c: Quest / mission search (Supabase)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function questSearch(intent: Intent, lat: number | null, lng: number | null): Promise<SearchResult[]> {
  try {
    let query = supabaseServer
      .from("quests")
      .select("id, title, description, quest_type, lat, lng, status")
      .eq("status", "open")
      .limit(15);

    if (intent.questType) {
      query = query.eq("quest_type", intent.questType);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data
      .filter((q) => {
        if (q.lat == null || q.lng == null) return false;
        // Skip if > 15km away
        if (lat != null && lng != null) {
          if (Math.abs(q.lat - lat) > 0.15 || Math.abs(q.lng - lng) > 0.15) return false;
        }
        return true;
      })
      .map((q) => ({
        originalName: `${QUEST_EMOJI[q.quest_type] ?? "🐾"} ${q.title ?? "Quest"}`,
        lat: q.lat, lng: q.lng, zoom: 14,
        description: q.description,
        relevance: "likely" as const,
        relevanceReason: `Community quest: ${q.quest_type}`,
        source: "quest" as const,
        questType: q.quest_type,
      }));
  } catch (e) {
    console.error("[map-search] Quest search error:", e);
  }
  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 3: Merge + geographic deduplication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mergeResults(google: SearchResult[], osm: SearchResult[]): SearchResult[] {
  const merged = [...google];
  for (const o of osm) {
    const tooClose = merged.some(
      (m) => Math.abs(m.lat - o.lat) < 0.0008 && Math.abs(m.lng - o.lng) < 0.0008
    );
    if (!tooClose) merged.push(o);
  }
  return merged;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 4: Gemini semantic ranking
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function rankResults(candidates: SearchResult[], filter: string): Promise<SearchResult[]> {
  const items = candidates
    .map((r, i) => {
      const src = r.source === "google" ? "[G]" : r.source === "quest" ? "[Q]" : "[OSM]";
      const desc = r.description ? `, addr: ${r.description}` : "";
      const rating = r.rating ? `, ⭐${r.rating.toFixed(1)}` : "";
      return `${i}: ${src} "${r.originalName}"${desc}${rating}`;
    })
    .join("\n");

  const prompt = `These are pet-related places found nearby in Ghent, Belgium:
${items}

The user specifically needs: "${filter}"

Score each 0-3:
  3 = specialist — very likely to fulfil this specific need
  2 = likely relevant
  1 = general, might help
  0 = probably cannot help

Reply ONLY compact JSON array, no markdown:
[{"idx":0,"score":2,"reason":"General vet"},{"idx":1,"score":3,"reason":"Bird specialist"}]`;

  try {
    const raw = await geminiPostRaw(prompt, 400);
    if (raw) {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const arr = JSON.parse(match[0]) as Array<{ idx: number; score: number; reason?: string }>;
        const scored = [...candidates];
        for (const item of arr) {
          if (item.idx >= 0 && item.idx < scored.length) {
            const rel = item.score >= 3 ? "specialist" : item.score === 2 ? "likely" : item.score === 1 ? "general" : "low";
            scored[item.idx] = { ...scored[item.idx], relevance: rel, relevanceReason: item.reason };
          }
        }
        return scored;
      }
    }
  } catch (e) {
    console.error("[map-search] Ranking error:", e);
  }
  return candidates;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase 5: Batch bilingual translation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function translateBatch(results: SearchResult[], targetLang: string): Promise<SearchResult[]> {
  const targetLangName = LANG_NAMES[targetLang] ?? targetLang;
  const nameList = results.map((r, i) => `${i}: "${r.originalName}"`).join("\n");

  const prompt = `Translate Belgian / Dutch place names to ${targetLangName}.

Rules:
- Use the well-known name in ${targetLangName} if it exists (e.g. "Gent" → "根特" in Chinese).
- Keep proper nouns unchanged when no standard translation exists.
- If the name is already in ${targetLangName} or is language-neutral, return it unchanged.
- Do NOT add parentheses, explanations, or any extra words.

Names (index: "name"):
${nameList}

Reply ONLY as a JSON array of strings in the same order as input, no markdown:
["translated 0", "translated 1", ...]`;

  try {
    const raw = await geminiPostRaw(prompt, results.length * 30 + 50);
    if (raw) {
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const arr = JSON.parse(match[0]) as string[];
        if (arr.length === results.length) {
          return results.map((r, i) => {
            const t = arr[i]?.trim() ?? "";
            if (!t || t === r.originalName) return r;
            return { ...r, localizedName: t };
          });
        }
      }
    }
  } catch (e) {
    console.error("[map-search] Translation error:", e);
  }
  return results;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Nominatim fallback search
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function nominatimSearch(query: string, zoom: number): Promise<SearchResult[]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "10");
    url.searchParams.set("accept-language", "nl");

    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": "PawPalWeb/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (resp.ok) {
      const data = await resp.json() as Array<Record<string, string>>;
      return data.map((item) => ({
        originalName: (item.display_name ?? "").split(", ").slice(0, 2).join(", "),
        lat: parseFloat(item.lat), lng: parseFloat(item.lon), zoom,
        relevance: "general" as const, source: "nominatim" as const,
      }));
    }
  } catch (e) {
    console.error("[map-search] Nominatim error:", e);
  }
  return [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gemini helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function geminiPostRaw(prompt: string, maxTokens: number): Promise<string | null> {
  try {
    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.0, maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    }
  } catch (e) {
    console.error("[map-search] Gemini raw error:", e);
  }
  return null;
}

async function geminiPost(prompt: string, maxTokens: number): Promise<Record<string, unknown> | null> {
  const raw = await geminiPostRaw(prompt, maxTokens);
  if (!raw) return null;
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function toLabel(osmValue: string): string {
  return osmValue
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
