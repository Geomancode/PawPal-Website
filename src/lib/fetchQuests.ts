import { supabase } from "./supabase";

export interface Quest {
  id: string;
  title: string;
  quest_type: string;
  status: string;
  reward_type: string;
  lat: number;
  lng: number;
  created_at: string;
}

export async function fetchQuests(): Promise<Quest[]> {
  const { data, error } = await supabase
    .from("quests")
    .select("id, title, quest_type, status, reward_type, lat, lng, created_at")
    .in("status", ["open", "assigned", "in_progress"]);

  if (error) {
    console.error("Error fetching quests:", error.message);
    return [];
  }
  return (data ?? []) as Quest[];
}
