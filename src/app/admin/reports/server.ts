import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultLocale, locales, type Locale } from "@/i18n/locales";
import { getProfileViews } from "@/lib/profileViews";

import {
  REPORTS_PAGE_SIZE,
  type CommentTargetSummary,
  type PendingReportView,
  type PostTargetSummary,
  type ProfileSummary,
  type ReportTargetSummary,
  type ReportTargetType,
  type ReportsPagePayload,
  type UserTargetSummary,
} from "./types";

export const ADMIN_REPORTS_SESSION_COOKIE = "pawpal_admin_reports_token";

export function adminReportsSessionCookieName(locale: Locale): string {
  return locale === defaultLocale
    ? ADMIN_REPORTS_SESSION_COOKIE
    : `${ADMIN_REPORTS_SESSION_COOKIE}_${locale}`;
}

export function readAdminReportsSessionToken(cookieStore: {
  getAll(): { name: string; value: string }[];
}): string | undefined {
  const names = new Set(locales.map(adminReportsSessionCookieName));
  const candidates = cookieStore.getAll().filter((cookie) => names.has(cookie.name));
  // Path-scoped cookies should yield exactly one token on a reports request.
  // Ambiguous or empty credentials never select an arbitrary former identity.
  return candidates.length === 1 && candidates[0].value
    ? candidates[0].value
    : undefined;
}

type AdminAccessResult =
  | {
      kind: "authorized";
      client: SupabaseClient;
      userId: string;
    }
  | {
      kind: "unauthenticated";
      message: string;
    }
  | {
      kind: "forbidden";
      userId: string;
    }
  | {
      kind: "error";
      message: string;
    };

type ReportsLoadResult =
  | {
      kind: "ready";
      viewerId: string;
      payload: ReportsPagePayload;
    }
  | Exclude<AdminAccessResult, { kind: "authorized"; client: SupabaseClient }>;

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string | null;
  target_type: string;
  target_id: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banned_at: string | null;
};

type PostRow = {
  id: string;
  content: string | null;
  user_id: string | null;
  author_id: string | null;
  created_at: string | null;
  removed_at: string | null;
};

type PostImageRow = {
  post_id: string;
  url: string;
  sort_order: number | null;
};

type CommentRow = {
  id: string;
  body: string | null;
  author_id: string | null;
  content_id: string | null;
  created_at: string | null;
  removed_at: string | null;
};

function requiredSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createReportsSupabaseClient(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = requiredSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function verifyAdminAccess(
  accessToken: string,
): Promise<AdminAccessResult> {
  if (!accessToken.trim()) {
    return {
      kind: "unauthenticated",
      message: "No active PawPal session was provided.",
    };
  }

  let client: SupabaseClient;
  try {
    client = createReportsSupabaseClient(accessToken);
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Supabase is not configured.",
    };
  }

  const { data: userData, error: userError } =
    await client.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return {
      kind: "unauthenticated",
      message: userError?.message ?? "The PawPal session is no longer valid.",
    };
  }

  const { data: isAdmin, error: adminError } =
    await client.rpc("is_pawpal_admin");

  if (adminError) {
    return {
      kind: "error",
      message: adminError.message,
    };
  }

  if (!isAdmin) {
    return {
      kind: "forbidden",
      userId: userData.user.id,
    };
  }

  return {
    kind: "authorized",
    client,
    userId: userData.user.id,
  };
}

export async function loadPendingReports(
  accessToken: string,
  page: number,
): Promise<ReportsLoadResult> {
  const admin = await verifyAdminAccess(accessToken);
  if (admin.kind !== "authorized") return admin;

  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * REPORTS_PAGE_SIZE;
  const to = from + REPORTS_PAGE_SIZE - 1;

  const { data, error, count } = await admin.client
    .from("reports")
    .select(
      "id, reporter_id, reported_user_id, reason, target_type, target_id, created_at",
      { count: "exact" },
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return {
      kind: "error",
      message: error.message,
    };
  }

  const rows = ((data ?? []) as ReportRow[]).map(normalizeReportRow);
  let reports: PendingReportView[];
  try {
    reports = await buildReportViews(admin.client, rows);
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to load report target summaries.",
    };
  }
  const total = count ?? reports.length;
  const totalPages = Math.max(1, Math.ceil(total / REPORTS_PAGE_SIZE));

  return {
    kind: "ready",
    viewerId: admin.userId,
    payload: {
      reports,
      page: safePage,
      pageSize: REPORTS_PAGE_SIZE,
      total,
      totalPages,
      hasPrevious: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

function normalizeReportRow(row: ReportRow): ReportRow & {
  target_type: ReportTargetType;
} {
  return {
    ...row,
    reason: row.reason?.trim() || "No reason provided",
    target_type: normalizeTargetType(row.target_type),
  };
}

function normalizeTargetType(value: string): ReportTargetType {
  if (value === "post" || value === "comment" || value === "user") {
    return value;
  }
  return "user";
}

async function buildReportViews(
  client: SupabaseClient,
  rows: Array<ReportRow & { target_type: ReportTargetType }>,
): Promise<PendingReportView[]> {
  const postIds = uniqueIds(
    rows
      .filter((row) => row.target_type === "post")
      .map((row) => row.target_id),
  );
  const commentIds = uniqueIds(
    rows
      .filter((row) => row.target_type === "comment")
      .map((row) => row.target_id),
  );
  const userTargetIds = uniqueIds(
    rows
      .filter((row) => row.target_type === "user")
      .map((row) => row.target_id ?? row.reported_user_id),
  );

  const [posts, postImages, comments] = await Promise.all([
    fetchPosts(client, postIds),
    fetchPostImages(client, postIds),
    fetchComments(client, commentIds),
  ]);

  const postMap = new Map(posts.map((post) => [post.id, post]));
  const postImageMap = firstPostImageMap(postImages);
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));

  const profileIds = new Set<string>();
  rows.forEach((row) => {
    profileIds.add(row.reporter_id);
    profileIds.add(row.reported_user_id);
  });
  userTargetIds.forEach((id) => profileIds.add(id));
  posts.forEach((post) => {
    const authorId = post.user_id ?? post.author_id;
    if (authorId) profileIds.add(authorId);
  });
  comments.forEach((comment) => {
    if (comment.author_id) profileIds.add(comment.author_id);
  });

  const profiles = await fetchProfiles(client, [...profileIds]);
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, toProfileSummary(profile)]),
  );

  return rows.map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason ?? "No reason provided",
    createdAt: row.created_at,
    reporter: profileMap.get(row.reporter_id) ?? null,
    reportedUser: profileMap.get(row.reported_user_id) ?? null,
    target: buildTargetSummary({
      row,
      postMap,
      postImageMap,
      commentMap,
      profileMap,
    }),
  }));
}

async function fetchPosts(client: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return [] as PostRow[];

  const { data, error } = await client
    .from("posts")
    .select("id, content, user_id, author_id, created_at, removed_at")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

async function fetchPostImages(client: SupabaseClient, postIds: string[]) {
  if (postIds.length === 0) return [] as PostImageRow[];

  const { data, error } = await client
    .from("post_images")
    .select("post_id, url, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PostImageRow[];
}

async function fetchComments(client: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return [] as CommentRow[];

  const { data, error } = await client
    .from("comments")
    .select("id, body, author_id, content_id, created_at, removed_at")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as CommentRow[];
}

async function fetchProfiles(client: SupabaseClient, ids: string[]) {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return [] as ProfileRow[];

  const views = await getProfileViews(client, unique);
  return views.map((view): ProfileRow => {
    if (view.visibility !== "admin" && view.visibility !== "self") {
      throw new Error("Admin profile access could not be confirmed");
    }
    const { id, display_name, username, avatar_url, banned_at } = view.profile;
    return { id, display_name, username, avatar_url, banned_at };
  });
}

function firstPostImageMap(images: PostImageRow[]) {
  const map = new Map<string, string>();
  images.forEach((image) => {
    if (!map.has(image.post_id)) {
      map.set(image.post_id, image.url);
    }
  });
  return map;
}

function buildTargetSummary({
  row,
  postMap,
  postImageMap,
  commentMap,
  profileMap,
}: {
  row: ReportRow & { target_type: ReportTargetType };
  postMap: Map<string, PostRow>;
  postImageMap: Map<string, string>;
  commentMap: Map<string, CommentRow>;
  profileMap: Map<string, ProfileSummary>;
}): ReportTargetSummary {
  const targetId = row.target_id;

  if (row.target_type === "post") {
    if (!targetId) return missingTarget(row.target_type, null);
    const post = postMap.get(targetId);
    if (!post) return missingTarget(row.target_type, targetId);
    const authorId = post.user_id ?? post.author_id;
    return {
      type: "post",
      id: post.id,
      bodyPreview: excerpt(post.content, 100, "Post has no text."),
      imageUrl: postImageMap.get(post.id) ?? null,
      author: authorId ? profileMap.get(authorId) ?? null : null,
      createdAt: post.created_at,
      removedAt: post.removed_at,
    } satisfies PostTargetSummary;
  }

  if (row.target_type === "comment") {
    if (!targetId) return missingTarget(row.target_type, null);
    const comment = commentMap.get(targetId);
    if (!comment) return missingTarget(row.target_type, targetId);
    return {
      type: "comment",
      id: comment.id,
      bodyPreview: excerpt(comment.body, 160, "Comment has no text."),
      author: comment.author_id
        ? profileMap.get(comment.author_id) ?? null
        : null,
      contentId: comment.content_id,
      createdAt: comment.created_at,
      removedAt: comment.removed_at,
    } satisfies CommentTargetSummary;
  }

  const userId = targetId ?? row.reported_user_id;
  return {
    type: "user",
    id: userId,
    profile: profileMap.get(userId) ?? null,
  } satisfies UserTargetSummary;
}

function missingTarget(type: ReportTargetType, id: string | null) {
  return {
    type: "missing",
    requestedType: type,
    id,
    label: id ? `Missing ${type} target` : `Missing ${type} target id`,
  } satisfies ReportTargetSummary;
}

function toProfileSummary(row: ProfileRow): ProfileSummary {
  const fallback = `User ${row.id.slice(0, 8)}`;
  return {
    id: row.id,
    displayName: row.display_name?.trim() || row.username?.trim() || fallback,
    username: row.username,
    avatarUrl: row.avatar_url,
    bannedAt: row.banned_at,
  };
}

function excerpt(value: string | null, maxLength: number, fallback: string) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function uniqueIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
