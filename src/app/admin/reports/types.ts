export const REPORTS_PAGE_SIZE = 20;

export type ReportTargetType = "post" | "comment" | "user";

export type ReportResolutionAction =
  | "dismissed"
  | "content_removed"
  | "user_banned";

export type ProfileSummary = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  bannedAt: string | null;
};

export type MissingTargetSummary = {
  type: "missing";
  requestedType: ReportTargetType;
  id: string | null;
  label: string;
};

export type PostTargetSummary = {
  type: "post";
  id: string;
  bodyPreview: string;
  imageUrl: string | null;
  author: ProfileSummary | null;
  createdAt: string | null;
  removedAt: string | null;
};

export type CommentTargetSummary = {
  type: "comment";
  id: string;
  bodyPreview: string;
  author: ProfileSummary | null;
  contentId: string | null;
  createdAt: string | null;
  removedAt: string | null;
};

export type UserTargetSummary = {
  type: "user";
  id: string;
  profile: ProfileSummary | null;
};

export type ReportTargetSummary =
  | MissingTargetSummary
  | PostTargetSummary
  | CommentTargetSummary
  | UserTargetSummary;

export type PendingReportView = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  targetType: ReportTargetType;
  targetId: string | null;
  reason: string;
  createdAt: string;
  reporter: ProfileSummary | null;
  reportedUser: ProfileSummary | null;
  target: ReportTargetSummary;
};

export type ReportsPagePayload = {
  reports: PendingReportView[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type ReportsClientState =
  | { kind: "needs-session"; page: number }
  | { kind: "session-expired"; page: number; message: string }
  | { kind: "error"; page: number; message: string }
  | { kind: "forbidden"; viewerId: string; page: number; message: string }
  | { kind: "ready"; viewerId: string; page: number };
