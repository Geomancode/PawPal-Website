"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/AuthProvider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  StatusMessage,
  buttonClassName,
} from "@/components/ui";
import { cn } from "@/lib/ui";
import {
  clearAdminReportsSession,
  resolveReportAction,
  syncAdminReportsSession,
} from "./actions";
import type {
  PendingReportView,
  ProfileSummary,
  ReportResolutionAction,
  ReportTargetSummary,
  ReportTargetType,
  ReportsClientState,
  ReportsPagePayload,
} from "./types";

type Toast = {
  tone: "success" | "danger" | "warning";
  title: string;
  text: string;
};

type Confirmation = {
  report: PendingReportView;
  action: Extract<ReportResolutionAction, "content_removed" | "user_banned">;
};

const targetTypeLabels: Record<ReportTargetType, string> = {
  post: "Post",
  comment: "Comment",
  user: "User",
};

const actionLabels: Record<ReportResolutionAction, string> = {
  dismissed: "Dismiss",
  content_removed: "Remove content",
  user_banned: "Ban user",
};

const ACTION_REFRESH_DELAY_MS = 600;
const SESSION_REDIRECT_DELAY_MS = 1200;

export default function ReportsClientParts({
  state,
}: {
  state: ReportsClientState;
}) {
  const router = useRouter();
  const { loading: authLoading, session, user } = useAuth();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const needsSession =
    state.kind === "needs-session" || state.kind === "session-expired";
  const bridgePage = needsSession ? state.page : 1;

  useEffect(() => {
    if (!needsSession) return;
    if (authLoading) return;

    let cancelled = false;

    if (!session?.access_token) {
      const timer = window.setTimeout(() => {
        const redirectToSignIn = () => {
          if (!cancelled) router.replace("/auth?next=/admin/reports");
        };

        if (state.kind !== "session-expired") {
          redirectToSignIn();
          return;
        }

        clearAdminReportsSession()
          .catch(() => undefined)
          .finally(redirectToSignIn);
      }, SESSION_REDIRECT_DELAY_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const resetErrorTimer = window.setTimeout(() => {
      if (!cancelled) setSessionError(null);
    }, 0);
    syncAdminReportsSession(session.access_token)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setSessionError(result.message);
          return;
        }
        const target =
          bridgePage > 1 ? `/admin/reports?page=${bridgePage}` : "/admin/reports";
        window.location.replace(target);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSessionError(
          error instanceof Error
            ? error.message
            : "Unable to verify this PawPal session.",
        );
      });

    return () => {
      cancelled = true;
      window.clearTimeout(resetErrorTimer);
    };
  }, [
    authLoading,
    needsSession,
    router,
    session?.access_token,
    bridgePage,
    state.kind,
  ]);

  if (needsSession) {
    return (
      <SessionGate
        authLoading={authLoading}
        email={user?.email ?? null}
        message={state.kind === "session-expired" ? state.message : null}
        sessionError={sessionError}
        syncing={Boolean(session?.access_token)}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <ErrorPanel
        message={state.message}
        onRetry={() => router.refresh()}
      />
    );
  }

  return <ReportsQueue payload={state.payload} />;
}

function SessionGate({
  authLoading,
  email,
  message,
  sessionError,
  syncing,
}: {
  authLoading: boolean;
  email: string | null;
  message: string | null;
  sessionError: string | null;
  syncing: boolean;
}) {
  if (sessionError) {
    return (
      <ErrorPanel
        message={sessionError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (authLoading || syncing) {
    return (
      <section className="admin-gate-panel">
        <LoadingState
          title="Checking admin access"
          description={
            email
              ? `Verifying PawPal admin permissions for ${email}.`
              : "Verifying the current PawPal session."
          }
        />
      </section>
    );
  }

  return (
    <section className="admin-gate-panel">
      <div>
        <p className="text-lg font-extrabold text-paw-ink">
          Sign in required
        </p>
        <p className="mt-2 text-sm leading-6 text-paw-body">
          {message ??
            "Use an approved PawPal admin account before opening the reports queue."}
        </p>
      </div>
        <Link
          href="/auth?next=/admin/reports"
          className={buttonClassName({ variant: "primary" })}
        >
          Sign in
        </Link>
    </section>
  );
}

function ReportsQueue({ payload }: { payload: ReportsPagePayload }) {
  const router = useRouter();
  const [resolvedReportIds, setResolvedReportIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState<{
    reportId: string;
    action: ReportResolutionAction;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [, startTransition] = useTransition();
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const reports = useMemo(
    () => payload.reports.filter((report) => !resolvedReportIds.has(report.id)),
    [payload.reports, resolvedReportIds],
  );

  const locallyResolvedCount = useMemo(
    () =>
      payload.reports.reduce(
        (count, report) =>
          resolvedReportIds.has(report.id) ? count + 1 : count,
        0,
      ),
    [payload.reports, resolvedReportIds],
  );

  const displayPayload = useMemo(() => {
    const total = Math.max(0, payload.total - locallyResolvedCount);
    const totalPages = Math.max(1, Math.ceil(total / payload.pageSize));

    return {
      ...payload,
      total,
      totalPages,
      hasPrevious: payload.page > 1,
      hasNext: payload.page < totalPages,
    };
  }, [locallyResolvedCount, payload]);

  const counts = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc[report.targetType] += 1;
        return acc;
      },
      { post: 0, comment: 0, user: 0 } satisfies Record<ReportTargetType, number>,
    );
  }, [reports]);

  function scheduleRefresh() {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      startTransition(() => {
        router.refresh();
      });
    }, ACTION_REFRESH_DELAY_MS);
  }

  async function resolveReport(
    report: PendingReportView,
    action: ReportResolutionAction,
  ) {
    setBusy({ reportId: report.id, action });
    setToast(null);

    const result = await resolveReportAction(report.id, action);

    if (result.ok) {
      setResolvedReportIds((current) => {
        const next = new Set(current);
        next.add(report.id);
        return next;
      });
      setToast({
        tone: "success",
        title: actionLabels[action],
        text: result.message,
      });
      setConfirmation(null);
      scheduleRefresh();
    } else {
      setToast({
        tone: "danger",
        title: "Action failed",
        text: result.message,
      });
    }

    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QueueMetric label="Pending" value={displayPayload.total} tone="warning" />
        <QueueMetric label="Posts" value={counts.post} tone="primary" />
        <QueueMetric label="Comments" value={counts.comment} tone="trust" />
        <QueueMetric label="Users" value={counts.user} tone="danger" />
      </div>

      {toast && (
        <StatusMessage tone={toast.tone} title={toast.title}>
          {toast.text}
        </StatusMessage>
      )}

      <Card className="admin-card-upgraded">
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-paw-ink">
                Pending queue
              </h2>
              <p className="mt-1 text-sm leading-6 text-paw-body">
                Newest reports are listed first. Each page shows up to{" "}
                {payload.pageSize} reports.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.refresh()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {reports.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No pending reports"
              description="Resolved reports leave the moderation queue automatically."
            />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  busy={busy?.reportId === report.id ? busy.action : null}
                  onDismiss={() => resolveReport(report, "dismissed")}
                  onConfirm={(action) => setConfirmation({ report, action })}
                />
              ))}
            </div>
          )}

          <Pagination payload={displayPayload} currentCount={reports.length} />
        </CardContent>
      </Card>

      {confirmation && (
        <ConfirmationDialog
          confirmation={confirmation}
          busy={
            busy?.reportId === confirmation.report.id ? busy.action : null
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={() =>
            resolveReport(confirmation.report, confirmation.action)
          }
        />
      )}
    </div>
  );
}

function ReportCard({
  report,
  busy,
  onDismiss,
  onConfirm,
}: {
  report: PendingReportView;
  busy: ReportResolutionAction | null;
  onDismiss: () => void;
  onConfirm: (
    action: Extract<ReportResolutionAction, "content_removed" | "user_banned">,
  ) => void;
}) {
  const canRemoveContent =
    report.targetType !== "user" && report.target.type !== "missing";
  const disabled = Boolean(busy);

  return (
    <article className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={targetBadgeTone(report.targetType)}>
              {targetTypeLabels[report.targetType]}
            </Badge>
            <Badge tone="warning">Pending</Badge>
            <span className="text-xs font-bold text-paw-muted">
              {formatDate(report.createdAt)}
            </span>
          </div>
          <h3 className="text-lg font-extrabold leading-tight text-paw-ink">
            {report.reason}
          </h3>
          <p className="break-all text-xs font-semibold text-paw-muted">
            Report {report.id}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:min-w-[340px]">
          <ProfileChip label="Reporter" profile={report.reporter} />
          <ProfileChip label="Reported user" profile={report.reportedUser} />
        </div>
      </div>

      <div className="mt-4">
        <TargetPreview target={report.target} />
      </div>

      {!canRemoveContent && report.targetType === "user" && (
        <p className="mt-3 text-xs font-semibold text-paw-muted">
          Remove content is available for post and comment reports. User reports
          can be dismissed or resolved with a user ban.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-paw-border pt-4 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onDismiss}
          disabled={disabled}
        >
          {busy === "dismissed" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          Dismiss
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full sm:w-auto"
          onClick={() => onConfirm("content_removed")}
          disabled={disabled || !canRemoveContent}
          title={
            canRemoveContent
              ? undefined
              : "Remove content is only available for post and comment reports."
          }
        >
          {busy === "content_removed" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          Remove content
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full sm:w-auto"
          onClick={() => onConfirm("user_banned")}
          disabled={disabled}
        >
          {busy === "user_banned" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Ban className="h-4 w-4" aria-hidden="true" />
          )}
          Ban user
        </Button>
      </div>
    </article>
  );
}

function TargetPreview({ target }: { target: ReportTargetSummary }) {
  if (target.type === "missing") {
    return (
      <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 flex-none text-paw-warning"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-extrabold text-paw-ink">{target.label}</p>
            <p className="mt-1 break-all text-sm leading-6 text-paw-body">
              Target id: {target.id ?? "not provided"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (target.type === "post") {
    return (
      <div className="grid gap-4 rounded-paw-md border border-paw-border bg-paw-panel p-4 md:grid-cols-[112px_minmax(0,1fr)]">
        <MediaThumb imageUrl={target.imageUrl} label="Reported post image" />
        <div className="min-w-0">
          <TargetHeader
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            title="Reported post"
            removedAt={target.removedAt}
          />
          <p className="mt-2 text-sm leading-6 text-paw-body">
            {target.bodyPreview}
          </p>
          <TargetMeta>
            <span>Author: {target.author?.displayName ?? "Unknown user"}</span>
            <span>Created {formatNullableDate(target.createdAt)}</span>
            <span className="break-all">Post {target.id}</span>
          </TargetMeta>
        </div>
      </div>
    );
  }

  if (target.type === "comment") {
    return (
      <div className="rounded-paw-md border border-paw-border bg-paw-panel p-4">
        <TargetHeader
          icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
          title="Reported comment"
          removedAt={target.removedAt}
        />
        <blockquote className="mt-3 border-l-4 border-paw-primary/30 pl-4 text-sm leading-6 text-paw-body">
          {target.bodyPreview}
        </blockquote>
        <TargetMeta>
          <span>Author: {target.author?.displayName ?? "Unknown user"}</span>
          <span>Created {formatNullableDate(target.createdAt)}</span>
          {target.contentId && (
            <span className="break-all">Parent post {target.contentId}</span>
          )}
          <span className="break-all">Comment {target.id}</span>
        </TargetMeta>
      </div>
    );
  }

  return (
    <div className="rounded-paw-md border border-paw-border bg-paw-panel p-4">
      <TargetHeader
        icon={<UserCircle2 className="h-4 w-4" aria-hidden="true" />}
        title="Reported user"
      />
      <div className="mt-4">
        <ProfileChip label="Account" profile={target.profile} large />
      </div>
      <p className="mt-3 break-all text-xs font-semibold text-paw-muted">
        User {target.id}
      </p>
    </div>
  );
}

function ConfirmationDialog({
  confirmation,
  busy,
  onCancel,
  onConfirm,
}: {
  confirmation: Confirmation;
  busy: ReportResolutionAction | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy =
    confirmation.action === "content_removed"
      ? {
          title: "Remove reported content?",
          text: "This resolves the report and marks the reported post or comment as removed. Ordinary users should no longer see it.",
          button: "Remove content",
          icon: Trash2,
        }
      : {
          title: "Ban reported user?",
          text: "This resolves the report and marks the reported user profile as banned. Banned users are blocked from creating new posts and comments.",
          button: "Ban user",
          icon: Ban,
        };
  const Icon = copy.icon;
  const isBusy = busy === confirmation.action;

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-paw-ink/45 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-confirm-title"
        className="w-full max-w-lg rounded-paw-lg border border-paw-border bg-paw-panel p-5 shadow-paw-panel"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-paw-md bg-paw-critical-soft text-paw-on-critical-soft">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="report-confirm-title"
                className="text-xl font-extrabold text-paw-ink"
              >
                {copy.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-paw-body">
                {copy.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-paw-sm p-2 text-paw-muted transition hover:bg-paw-panel-subtle hover:text-paw-ink"
            aria-label="Close confirmation"
            disabled={isBusy}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 rounded-paw-md border border-paw-border bg-paw-panel-subtle p-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-paw-muted">
            Report reason
          </p>
          <p className="mt-1 text-sm font-bold text-paw-ink">
            {confirmation.report.reason}
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {copy.button}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QueueMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "trust" | "warning" | "danger";
}) {
  return (
    <Card className="admin-card-upgraded">
      <CardContent className="p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-paw-muted">
          {label}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-2xl font-extrabold text-paw-ink">{value}</p>
          <Badge tone={tone}>{label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({
  payload,
  currentCount,
}: {
  payload: ReportsPagePayload;
  currentCount: number;
}) {
  if (payload.totalPages <= 1 && currentCount === payload.total) return null;

  const previousHref =
    payload.page <= 2 ? "/admin/reports" : `/admin/reports?page=${payload.page - 1}`;
  const nextHref = `/admin/reports?page=${payload.page + 1}`;

  return (
    <nav
      className="flex flex-col gap-3 border-t border-paw-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Reports pagination"
    >
      <p className="text-sm font-semibold text-paw-muted">
        Page {payload.page} of {payload.totalPages} · {payload.total} pending
        total
      </p>
      <div className="flex gap-2">
        {payload.hasPrevious ? (
          <Link
            href={previousHref}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Link>
        ) : (
          <span
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </span>
        )}
        {payload.hasNext ? (
          <Link
            href={nextHref}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}

function ProfileChip({
  label,
  profile,
  large = false,
}: {
  label: string;
  profile: ProfileSummary | null;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-paw-md border border-paw-border bg-paw-panel p-3",
        large && "max-w-md",
      )}
    >
      <p className="text-xs font-extrabold uppercase tracking-wide text-paw-muted">
        {label}
      </p>
      <div className="mt-2 flex min-w-0 items-center gap-3">
        <Avatar profile={profile} size={large ? 44 : 36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-paw-ink">
            {profile?.displayName ?? "Unknown user"}
          </p>
          <p className="truncate text-xs font-semibold text-paw-muted">
            {profile?.username ? `@${profile.username}` : profile?.id ?? "No profile"}
          </p>
        </div>
        {profile?.bannedAt && (
          <Badge tone="danger" className="ml-auto">
            Banned
          </Badge>
        )}
      </div>
    </div>
  );
}

function Avatar({
  profile,
  size,
}: {
  profile: ProfileSummary | null;
  size: number;
}) {
  return (
    <div
      className="relative flex-none overflow-hidden rounded-full bg-paw-primary-soft text-paw-on-primary-soft"
      style={{ height: size, width: size }}
    >
      {profile?.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={profile.displayName}
          fill
          sizes={`${size}px`}
          unoptimized
          loading="lazy"
          className="object-cover"
        />
      ) : (
        <UserCircle2
          className="absolute inset-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function MediaThumb({
  imageUrl,
  label,
}: {
  imageUrl: string | null;
  label: string;
}) {
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-paw-md bg-paw-primary-soft md:h-28 md:w-28">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes="112px"
          unoptimized
          loading="lazy"
          className="object-cover"
        />
      ) : (
        <FileText
          className="absolute inset-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-paw-primary"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function TargetHeader({
  icon,
  title,
  removedAt,
}: {
  icon: ReactNode;
  title: string;
  removedAt?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-paw-ink">
        {icon}
        {title}
      </span>
      {removedAt && <Badge tone="neutral">Already removed</Badge>}
    </div>
  );
}

function TargetMeta({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-paw-muted">
      {children}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="admin-gate-panel">
      <div>
        <p className="text-lg font-extrabold text-paw-ink">
          Unable to load reports
        </p>
        <p className="mt-2 text-sm leading-6 text-paw-body">
          {message}
        </p>
      </div>
        <Button type="button" variant="secondary" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
    </section>
  );
}

function LoadingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <Loader2
        className="h-8 w-8 animate-spin text-paw-primary"
        aria-hidden="true"
      />
      <p className="mt-4 text-lg font-extrabold text-paw-ink">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-paw-body">
        {description}
      </p>
    </div>
  );
}

function targetBadgeTone(targetType: ReportTargetType) {
  switch (targetType) {
    case "post":
      return "primary";
    case "comment":
      return "trust";
    case "user":
      return "danger";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNullableDate(value: string | null) {
  if (!value) return "unknown";
  return formatDate(value);
}
