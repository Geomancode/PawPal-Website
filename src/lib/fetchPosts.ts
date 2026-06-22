import { supabase } from "./supabase";

export type PostCategory =
  | "food"
  | "vet"
  | "store"
  | "adoption"
  | "lostAndFound"
  | "walk"
  | "custom";

export interface MapPost {
  id: string;
  content: string | null;
  category: PostCategory | string | null;
  custom_category_label: string | null;
  pin_icon: string | null;
  post_type: string | null;
  lat: number;
  lng: number;
  created_at: string;
  expires_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  distance_km?: number;
}

export interface NearbyPostQuery {
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

function isActivePost(post: MapPost): boolean {
  if (!post.expires_at) return true;
  const expiresAt = new Date(post.expires_at).getTime();
  return Number.isNaN(expiresAt) || expiresAt >= Date.now();
}

export async function fetchPosts(options: NearbyPostQuery = {}): Promise<MapPost[]> {
  const radiusKm = options.radiusKm ?? 15;
  const limit = options.limit ?? 120;
  let query = supabase
    .from("posts")
    .select("id, content, category, custom_category_label, pin_icon, post_type, lat, lng, created_at, expires_at, like_count, comment_count")
    .eq("visibility", "public")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("created_at", { ascending: false })
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
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching posts:", error.message);
    return [];
  }

  const posts = ((data ?? []) as MapPost[])
    .filter((post) => post.lat != null && post.lng != null)
    .filter((post) => Number.isFinite(post.lat) && Number.isFinite(post.lng))
    .filter(isActivePost);

  if (!isFiniteCoordinate(options.lat, options.lng)) return posts;

  const centerLat = options.lat!;
  const centerLng = options.lng!;
  return posts
    .map((post) => ({
      ...post,
      distance_km: distanceKm(centerLat, centerLng, post.lat, post.lng),
    }))
    .filter((post) => (post.distance_km ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
}
