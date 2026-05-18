import { supabase } from "./supabase";

export interface Place {
  id: string;
  name: string;
  place_type: string;
  lat: number;
  lng: number;
  city: string;
  rating_avg: number | null;
  distance_km?: number;
}

export interface NearbyQuery {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

function isFiniteCoordinate(lat?: number, lng?: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const earthKm = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

export async function fetchPlaces(options: NearbyQuery = {}): Promise<Place[]> {
  const radiusKm = options.radiusKm ?? 15;
  const limit = options.limit ?? 120;
  let query = supabase
    .from("places")
    .select("id, name, place_type, lat, lng, city, rating_avg")
    .limit(limit);

  if (isFiniteCoordinate(options.lat, options.lng)) {
    const centerLat = options.lat!;
    const centerLng = options.lng!;
    const latDelta = radiusKm / 111;
    const lngScale = Math.max(Math.cos((centerLat * Math.PI) / 180), 0.2);
    const lngDelta = radiusKm / (111 * lngScale);
    query = query
      .gte("lat", centerLat - latDelta)
      .lte("lat", centerLat + latDelta)
      .gte("lng", centerLng - lngDelta)
      .lte("lng", centerLng + lngDelta);
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching places:", error.message);
    return [];
  }

  const places = (data ?? []) as Place[];
  if (!isFiniteCoordinate(options.lat, options.lng)) return places;

  const centerLat = options.lat!;
  const centerLng = options.lng!;
  return places
    .filter((place) => place.lat != null && place.lng != null)
    .map((place) => ({
      ...place,
      distance_km: distanceKm(centerLat, centerLng, place.lat, place.lng),
    }))
    .filter((place) => (place.distance_km ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
}
