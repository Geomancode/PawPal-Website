import { supabase } from "./supabase";

export interface Place {
  id: string;
  name: string;
  place_type: string;
  lat: number;
  lng: number;
  city: string;
  rating_avg: number | null;
}

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select("id, name, place_type, lat, lng, city, rating_avg");

  if (error) {
    console.error("Error fetching places:", error.message);
    return [];
  }
  return (data ?? []) as Place[];
}
