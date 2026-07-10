export const HOME_GLOBE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

const HOME_GLOBE_RPC = "homepage_globe_hot_posts";
const HOME_GLOBE_LIMIT = 12;
const GEOHASH_2_PATTERN = /^[0123456789bcdefghjkmnpqrstuvwxyz]{2}$/;

export interface HomeGlobePost {
  id: string;
  display_lat: number;
  display_lng: number;
  region_key: string;
  location_label: string;
  category: string;
  pin_icon: string | null;
  snippet: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  expires_at: string | null;
}

type HomeGlobeRpcResult = {
  data: unknown;
  error: unknown;
};

export interface HomeGlobeRpcClient {
  rpc(
    functionName: typeof HOME_GLOBE_RPC,
    args: { p_limit: number },
  ): PromiseLike<HomeGlobeRpcResult>;
}

export type HomeGlobeErrorReporter = (error: unknown) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, field: keyof HomeGlobePost) {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRoundedToTenth(value: number) {
  const scaled = value * 10;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseHomeGlobePost(value: unknown): HomeGlobePost | null {
  if (!isRecord(value)) return null;

  const requiredFields: (keyof HomeGlobePost)[] = [
    "id",
    "display_lat",
    "display_lng",
    "region_key",
    "location_label",
    "category",
    "pin_icon",
    "snippet",
    "like_count",
    "comment_count",
    "created_at",
    "expires_at",
  ];

  if (!requiredFields.every((field) => hasOwn(value, field))) return null;

  const {
    id,
    display_lat: displayLat,
    display_lng: displayLng,
    region_key: regionKey,
    location_label: locationLabel,
    category,
    pin_icon: pinIcon,
    snippet,
    like_count: likeCount,
    comment_count: commentCount,
    created_at: createdAt,
    expires_at: expiresAt,
  } = value;

  if (typeof id !== "string" || id.length === 0) return null;
  if (
    !isFiniteNumber(displayLat) ||
    displayLat < -90 ||
    displayLat > 90 ||
    !isRoundedToTenth(displayLat)
  ) {
    return null;
  }
  if (
    !isFiniteNumber(displayLng) ||
    displayLng < -180 ||
    displayLng > 180 ||
    !isRoundedToTenth(displayLng)
  ) {
    return null;
  }
  if (typeof regionKey !== "string" || !GEOHASH_2_PATTERN.test(regionKey)) {
    return null;
  }
  if (typeof locationLabel !== "string" || typeof category !== "string") {
    return null;
  }
  if (!isNullableString(pinIcon) || !isNullableString(snippet)) return null;
  if (snippet !== null && [...snippet].length > 64) return null;
  if (!isNonNegativeInteger(likeCount) || !isNonNegativeInteger(commentCount)) {
    return null;
  }
  if (!isValidTimestamp(createdAt)) return null;
  if (expiresAt !== null && !isValidTimestamp(expiresAt)) return null;

  // Rebuild the object so an unexpected backend field can never leak through.
  return {
    id,
    display_lat: displayLat,
    display_lng: displayLng,
    region_key: regionKey,
    location_label: locationLabel,
    category,
    pin_icon: pinIcon,
    snippet,
    like_count: likeCount,
    comment_count: commentCount,
    created_at: createdAt,
    expires_at: expiresAt,
  };
}

function unavailableResponse(
  error: unknown,
  reportError?: HomeGlobeErrorReporter,
) {
  reportError?.(error);

  return Response.json(
    { error: "Home globe posts are temporarily unavailable." },
    {
      status: 503,
      headers: { "Cache-Control": HOME_GLOBE_CACHE_CONTROL },
    },
  );
}

export async function createHomeGlobePostsResponse(
  rpcClient: HomeGlobeRpcClient,
  reportError?: HomeGlobeErrorReporter,
): Promise<Response> {
  let result: HomeGlobeRpcResult;

  try {
    result = await rpcClient.rpc(HOME_GLOBE_RPC, { p_limit: HOME_GLOBE_LIMIT });
  } catch (error) {
    return unavailableResponse(error, reportError);
  }

  if (result.error) return unavailableResponse(result.error, reportError);
  if (!Array.isArray(result.data)) {
    return unavailableResponse(
      new Error("Homepage globe RPC returned a non-array payload."),
      reportError,
    );
  }

  const posts = result.data.flatMap((row) => {
    const post = parseHomeGlobePost(row);
    return post ? [post] : [];
  });

  return Response.json(posts, {
    status: 200,
    headers: { "Cache-Control": HOME_GLOBE_CACHE_CONTROL },
  });
}
