// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PawPal Web AI Agent — Tool Definitions + Executors
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 4 read-only tools that query Supabase, mirroring the Flutter agent tools.
// Each tool has a Gemini FunctionDeclaration + an execute function.

import { Type, type FunctionDeclaration } from "@google/genai";
import { supabaseServer as supabase } from "@/lib/supabaseServer";

// ── Tool Declarations (Gemini Function Calling schema) ───────────────────────

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "search_places",
    description:
      "Search for pet-friendly places like vets, dog parks, pet shops, groomers, shelters, cafés. Returns name, type, city, coordinates, and rating.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Search keywords, e.g. "vet", "dog park", "groomer ghent"',
        },
        place_type: {
          type: Type.STRING,
          description: "Optional filter by place type",
          enum: [
            "vet",
            "groomer",
            "pet_shop",
            "park",
            "dog_park",
            "cafe",
            "shelter",
            "kennel",
            "training",
            "stable",
            "aquarium_shop",
            "exotic_vet",
            "zoo",
            "wildlife_centre",
          ],
        },
        city: {
          type: Type.STRING,
          description: "Optional city filter, e.g. 'Ghent', 'Antwerp'",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_missions",
    description:
      "Search for pet community missions (quests) like dog walking, fostering, vet accompany, care tasks. Returns title, type, status, reward, and coordinates.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Search keywords, e.g. "walk", "foster", "care"',
        },
        quest_type: {
          type: Type.STRING,
          description: "Optional filter by mission type",
          enum: [
            "walk",
            "care",
            "knowledge",
            "share",
            "skill",
            "transport",
            "foster",
            "vet_accompany",
          ],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "check_food_safety",
    description:
      "Check if a specific food, plant, or substance is safe or toxic for a pet species (dog, cat, rabbit, bird, etc). Returns toxicity level and risk description.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        item_name: {
          type: Type.STRING,
          description:
            "The food/plant/substance to check, e.g. 'chocolate', 'grapes', 'lily'",
        },
        species: {
          type: Type.STRING,
          description: "The pet species to check for",
          enum: ["dog", "cat", "rabbit", "bird", "fish", "hamster", "horse"],
        },
      },
      required: ["item_name"],
    },
  },
  {
    name: "breed_encyclopedia",
    description:
      "Look up detailed breed information including origin, size, care difficulty, temperament, lifespan, and legal status in Belgium.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        breed_name: {
          type: Type.STRING,
          description:
            'The breed name to look up, e.g. "Golden Retriever", "Bengal Cat", "Holland Lop"',
        },
        species_group: {
          type: Type.STRING,
          description: "Optional species group filter",
          enum: [
            "canine",
            "feline",
            "equine",
            "leporidae",
            "avian",
            "rodent",
            "reptile",
            "amphibian",
            "fish",
          ],
        },
      },
      required: ["breed_name"],
    },
  },
];

// ── Tool Executors ───────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (name) {
    case "search_places":
      return await searchPlaces(args);
    case "search_missions":
      return await searchMissions(args);
    case "check_food_safety":
      return await checkFoodSafety(args);
    case "breed_encyclopedia":
      return await breedEncyclopedia(args);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── search_places ────────────────────────────────────────────────────────────

async function searchPlaces(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const query = (args.query as string) || "";
  const placeType = args.place_type as string | undefined;
  const city = args.city as string | undefined;

  let q = supabase
    .from("places")
    .select("id, name, place_type, lat, lng, city, rating_avg")
    .limit(10);

  // Apply filters
  if (placeType) {
    q = q.eq("place_type", placeType);
  }
  if (city) {
    q = q.ilike("city", `%${city}%`);
  }

  // Text search on name and place_type
  if (query && !placeType) {
    q = q.or(
      `name.ilike.%${query}%,place_type.ilike.%${query}%,city.ilike.%${query}%`
    );
  } else if (query) {
    q = q.ilike("name", `%${query}%`);
  }

  const { data, error } = await q;
  if (error) {
    return { error: error.message, places: [], count: 0 };
  }

  return {
    places: data ?? [],
    count: (data ?? []).length,
    query,
    filters: { place_type: placeType, city },
  };
}

// ── search_missions ──────────────────────────────────────────────────────────

async function searchMissions(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const query = (args.query as string) || "";
  const questType = args.quest_type as string | undefined;

  let q = supabase
    .from("quests")
    .select("id, title, quest_type, status, reward_type, lat, lng")
    .limit(10);

  if (questType) {
    q = q.eq("quest_type", questType);
  }

  if (query && !questType) {
    q = q.or(`title.ilike.%${query}%,quest_type.ilike.%${query}%`);
  } else if (query) {
    q = q.ilike("title", `%${query}%`);
  }

  const { data, error } = await q;
  if (error) {
    return { error: error.message, missions: [], count: 0 };
  }

  return {
    missions: data ?? [],
    count: (data ?? []).length,
    query,
    filters: { quest_type: questType },
  };
}

// ── check_food_safety ────────────────────────────────────────────────────────

async function checkFoodSafety(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const itemName = (args.item_name as string) || "";
  const species = args.species as string | undefined;

  // DB columns: name_en, toxicity_level, species_affected, symptoms_en, action_en
  let q = supabase
    .from("toxicity_items")
    .select("id, name_en, name_nl, item_type, toxicity_level, species_affected, symptoms_en, action_en")
    .ilike("name_en", `%${itemName}%`)
    .limit(5);

  if (species) {
    // species_affected is a text[] array — use contains operator
    q = q.contains("species_affected", [species]);
  }

  const { data, error } = await q;
  if (error) {
    return { error: error.message, results: [], found: false };
  }

  // Map to consistent result shape for UI cards
  const results = (data ?? []).map((r) => ({
    item_name: r.name_en,
    item_type: r.item_type,
    toxicity_level: r.toxicity_level,
    species_affected: r.species_affected,
    description: r.symptoms_en,
    action: r.action_en,
  }));

  return {
    results,
    found: results.length > 0,
    item_searched: itemName,
    species_filter: species,
  };
}

// ── breed_encyclopedia ───────────────────────────────────────────────────────

async function breedEncyclopedia(
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const breedName = (args.breed_name as string) || "";
  const speciesGroup = args.species_group as string | undefined;

  // DB columns: name_en, species_group, origin_country, care_difficulty, avg_lifespan_years, legal_status_be
  let q = supabase
    .from("species_breeds")
    .select("id, name_en, species_group, origin_country, origin_region, care_difficulty, avg_lifespan_years, adult_weight_kg_min, adult_weight_kg_max, legal_status_be, suitable_for_children, energy_level, social_needs")
    .ilike("name_en", `%${breedName}%`)
    .limit(5);

  if (speciesGroup) {
    q = q.eq("species_group", speciesGroup);
  }

  const { data, error } = await q;
  if (error) {
    return { error: error.message, breeds: [], found: false };
  }

  // Map to consistent result shape for UI cards
  const breeds = (data ?? []).map((b) => ({
    breed_name: b.name_en,
    species_group: b.species_group,
    origin: b.origin_country ? `${b.origin_country}${b.origin_region ? ` (${b.origin_region})` : ""}` : null,
    care_difficulty: b.care_difficulty,
    lifespan: b.avg_lifespan_years ? `${b.avg_lifespan_years} years` : null,
    weight: b.adult_weight_kg_min && b.adult_weight_kg_max ? `${b.adult_weight_kg_min}-${b.adult_weight_kg_max} kg` : null,
    legal_status_be: b.legal_status_be,
    suitable_for_children: b.suitable_for_children,
    energy_level: b.energy_level,
  }));

  return {
    breeds,
    found: breeds.length > 0,
    searched: breedName,
  };
}
