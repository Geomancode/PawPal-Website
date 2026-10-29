import type { SupabaseClient } from "@supabase/supabase-js";

export type BasicProfile = {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  location_city: string | null;
};

type PublicProfile = BasicProfile & {
  bio: string | null;
  trust_level: number;
  paw_points: number;
  is_verified: boolean;
  created_at: string;
  custom_badge: string | null;
  profile_tags: unknown;
};

type OwnProfile = PublicProfile & {
  language_pref: string;
  updated_at: string;
  home_address: string | null;
  pet_preferences: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  quick_actions: unknown;
  banned_at: string | null;
};

export type ProfileView =
  | { visibility: "private"; profile: BasicProfile }
  | { visibility: "public"; profile: PublicProfile }
  | { visibility: "self" | "admin"; profile: OwnProfile };

const BASIC_FIELDS = ["id", "display_name", "username", "avatar_url", "location_city"];
const PUBLIC_FIELDS = [...BASIC_FIELDS, "bio", "trust_level", "paw_points", "is_verified", "created_at", "custom_badge", "profile_tags"];
const OWN_FIELDS = [...PUBLIC_FIELDS, "language_pref", "updated_at", "home_address", "pet_preferences", "subscription_tier", "subscription_expires_at", "quick_actions", "banned_at"];

function invalid(): never {
  // Do not include the rejected payload, credentials or private fields in errors.
  throw new Error("Invalid profile view response");
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}

function exactFields(value: Record<string, unknown>, fields: string[]) {
  if (Object.keys(value).length !== fields.length || fields.some((key) => !Object.hasOwn(value, key))) invalid();
}

function string(value: unknown): string {
  if (typeof value !== "string") return invalid();
  return value;
}

function nullableString(value: unknown): string | null {
  return value === null ? null : string(value);
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return invalid();
  return value;
}

function parseView(value: unknown): ProfileView {
  const envelope = record(value);
  exactFields(envelope, ["visibility", "profile"]);
  const visibility = envelope.visibility;
  if (visibility !== "self" && visibility !== "admin" && visibility !== "public" && visibility !== "private") return invalid();
  const row = record(envelope.profile);
  exactFields(row, visibility === "private" ? BASIC_FIELDS : visibility === "public" ? PUBLIC_FIELDS : OWN_FIELDS);
  const basic: BasicProfile = {
    id: string(row.id),
    display_name: nullableString(row.display_name),
    username: string(row.username),
    avatar_url: nullableString(row.avatar_url),
    location_city: nullableString(row.location_city),
  };
  if (visibility === "private") return { visibility, profile: basic };
  if (typeof row.is_verified !== "boolean") return invalid();
  const publicProfile: PublicProfile = {
    ...basic,
    bio: nullableString(row.bio),
    trust_level: integer(row.trust_level),
    paw_points: integer(row.paw_points),
    is_verified: row.is_verified,
    created_at: string(row.created_at),
    custom_badge: nullableString(row.custom_badge),
    profile_tags: row.profile_tags,
  };
  if (visibility === "public") return { visibility, profile: publicProfile };
  if (visibility !== "self" && visibility !== "admin") return invalid();
  return {
    visibility,
    profile: {
      ...publicProfile,
      language_pref: string(row.language_pref),
      updated_at: string(row.updated_at),
      home_address: nullableString(row.home_address),
      pet_preferences: nullableString(row.pet_preferences),
      subscription_tier: string(row.subscription_tier),
      subscription_expires_at: nullableString(row.subscription_expires_at),
      quick_actions: row.quick_actions,
      banned_at: nullableString(row.banned_at),
    },
  };
}

export async function getProfileView(client: SupabaseClient, userId: string): Promise<ProfileView | null> {
  const { data, error } = await client.rpc("get_profile_view", { p_user_id: userId });
  if (error) throw error;
  if (data === null) return null;
  const view = parseView(data);
  if (view.profile.id !== userId) return invalid();
  return view;
}

// Consumer projection is narrower than the backend's public projection. Only
// these display fields may enter the public page's HTML/RSC or metadata.
export async function getPublicProfileView(client: SupabaseClient, userId: string) {
  const view = await getProfileView(client, userId);
  if (!view) return null;
  if (view.visibility !== "public" && view.visibility !== "private") return invalid();
  const { id, display_name, username, avatar_url, location_city } = view.profile;
  const profile: BasicProfile & { bio?: string | null; paw_points?: number; is_verified?: boolean } = {
    id, display_name, username, avatar_url, location_city,
  };
  if (view.visibility === "public") {
    profile.bio = view.profile.bio;
    profile.paw_points = view.profile.paw_points;
    profile.is_verified = view.profile.is_verified;
  }
  return { isPublic: view.visibility === "public", profile };
}

export async function getOwnProfile(client: SupabaseClient, userId: string): Promise<OwnProfile | null> {
  const view = await getProfileView(client, userId);
  if (!view) return null;
  if (view.visibility !== "self") return invalid();
  return view.profile;
}

export async function loadOrCreateOwnProfile(
  client: SupabaseClient,
  identity: { id: string; username: string; display_name: string | null },
): Promise<OwnProfile> {
  const existing = await getOwnProfile(client, identity.id);
  if (existing) return existing;
  // Defaults belong to the database. Never upsert over a concurrently created
  // profile, nor request SELECT * through INSERT RETURNING after column grants.
  const { error } = await client.from("profiles").insert({
    id: identity.id,
    username: identity.username,
    display_name: identity.display_name,
  });
  if (error && error.code !== "23505") throw error;
  // Only an actual same-owner RPC row proves a concurrent create succeeded.
  const created = await getOwnProfile(client, identity.id);
  if (!created) throw new Error("Profile creation could not be confirmed");
  return created;
}

export async function getProfileViews(client: SupabaseClient, userIds: string[]): Promise<ProfileView[]> {
  const uniqueIds = [...new Set(userIds)];
  const views: ProfileView[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    const ids = uniqueIds.slice(offset, offset + 100);
    const { data, error } = await client.rpc("get_profile_views", { p_user_ids: ids });
    if (error) throw error;
    if (!Array.isArray(data)) return invalid();
    const seen = new Set<string>();
    for (const item of data) {
      const view = parseView(item);
      if (!ids.includes(view.profile.id) || seen.has(view.profile.id)) return invalid();
      seen.add(view.profile.id);
      views.push(view);
    }
  }
  return views;
}
