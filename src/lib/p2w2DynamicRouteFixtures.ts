export const P2W2_DYNAMIC_ROUTE_FIXTURE_ENV = "P2W2_DYNAMIC_ROUTE_FIXTURES";

type P2W2PetSocialTraits = {
  health_badges?: string[];
  social_tags?: string[];
  quirk?: string;
  achievements?: string[];
};

export type P2W2TagFixture = {
  pet: {
    id: string;
    name: string;
    breed: string | null;
    age: number | null;
    avatar_url: string | null;
    social_traits: P2W2PetSocialTraits | null;
    blood_type: string | null;
    owner_contact: string | null;
    created_at: string;
    owner_id: string;
  };
  owner: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  } | null;
};

export type P2W2PostFixture = {
  post: {
    id: string;
    user_id?: string | null;
    author_id?: string | null;
    content?: string | null;
    category?: string | null;
    image_url?: string | null;
    walk_map_image_url?: string | null;
    likes_count?: number | null;
    like_count?: number | null;
    comments_count?: number | null;
    comment_count?: number | null;
  };
  profile: {
    display_name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  images: Array<{ url: string; sort_order?: number | null }>;
};

export type P2W2GroupFixture = {
  group: {
    id: string;
    name: string;
    avatar_url: string | null;
    owner_id: string | null;
    created_at: string;
  };
  memberCount: number;
};

type P2W2PetPreview = {
  id: string;
  name: string;
  species_group?: string | null;
  breed?: string | null;
  avatar_url?: string | null;
};

export type P2W2UserFixture = {
  profile: {
    id: string;
    display_name?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    paw_points?: number | null;
    location_city?: string | null;
    is_verified?: boolean | null;
  };
  pets: P2W2PetPreview[];
  postCount: number;
};

type P2W2FixtureData = {
  tags: Record<string, P2W2TagFixture>;
  posts: Record<string, P2W2PostFixture>;
  groups: Record<string, P2W2GroupFixture>;
  users: Record<string, P2W2UserFixture>;
};

let fixtureDataCache: Promise<P2W2FixtureData> | null = null;

function flagValueIsEnabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

export function isP2W2DynamicRouteFixtureEnabled() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return flagValueIsEnabled(process.env[P2W2_DYNAMIC_ROUTE_FIXTURE_ENV]);
}

async function readFixtureData() {
  if (!isP2W2DynamicRouteFixtureEnabled()) {
    return null;
  }

  fixtureDataCache ??= import("./p2w2DynamicRouteFixtureFile").then((module) =>
    module.readP2W2DynamicRouteFixtureData<P2W2FixtureData>(),
  );

  return fixtureDataCache;
}

export async function loadP2W2TagFixture(id: string) {
  const data = await readFixtureData();
  return data?.tags[id] ?? null;
}

export async function loadP2W2PostFixture(id: string) {
  const data = await readFixtureData();
  return data?.posts[id] ?? null;
}

export async function loadP2W2GroupFixture(id: string) {
  const data = await readFixtureData();
  return data?.groups[id] ?? null;
}

export async function loadP2W2UserFixture(id: string) {
  const data = await readFixtureData();
  return data?.users[id] ?? null;
}
