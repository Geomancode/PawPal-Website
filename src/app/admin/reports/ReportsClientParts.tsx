"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PawIcon, { type PawIconName } from "@/components/icons/PawIcon";
import {
  createContext,
  forwardRef,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/AuthProvider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  MetricTile,
  PageShell,
  StatusMessage,
  buttonClassName,
} from "@/components/ui";
import { cn } from "@/lib/ui";
import { loadP3B1g2hAdminFixtures } from "@/lib/p3b1g2hAdminFixtures";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { localeFromPath, localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages/en";
import {
  clearAdminReportsSession,
  resolveReportAction,
  loadReportsAction,
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

type EmptyStateIconProps = ComponentPropsWithoutRef<
  NonNullable<ComponentProps<typeof EmptyState>["icon"]>
>;

function createEmptyStateIcon(name: PawIconName) {
  return forwardRef<SVGSVGElement, EmptyStateIconProps>(function EmptyStatePawIcon({
    className,
    "aria-hidden": ariaHidden,
  }, ref) {
    void ref;
    return <PawIcon name={name} className={className} aria-hidden={ariaHidden} />;
  });
}

const FileApprovedEmptyStateIcon = createEmptyStateIcon("fileApproved");

type Toast = {
  tone: "success" | "critical" | "warning";
  title: string;
  text: string;
};

type Confirmation = {
  report: PendingReportView;
  action: Extract<ReportResolutionAction, "content_removed" | "user_banned">;
};

type ReportsTranslation = ReturnType<typeof useRouteTranslations>["t"];
type ReportsI18nContextValue = {
  locale: Locale;
  path: (href: string) => string;
  t: ReportsTranslation;
};

const ReportsI18nContext = createContext<ReportsI18nContextValue>(null as never);

function useReportsI18n() {
  return useContext(ReportsI18nContext);
}

const targetTypeLabelKeys: Record<ReportTargetType, MessageKey> = {
  post: "adminReportsTargetPost",
  comment: "adminReportsTargetComment",
  user: "adminReportsTargetUser",
};

const actionLabelKeys: Record<ReportResolutionAction, MessageKey> = {
  dismissed: "adminReportsDismiss",
  content_removed: "adminReportsRemoveContent",
  user_banned: "adminReportsBanUser",
};

const ACTION_REFRESH_DELAY_MS = 600;
const SESSION_REDIRECT_DELAY_MS = 1200;
const REPORT_METRIC_CLASSES = {
  shellTopSpacing: "pt-paw-web-shell-top",
  previewMediaSize: "h-[112px] md:h-[112px] md:w-[112px]",
  emptyStateMinHeight: "min-h-[256px]",
} as const;
const ADMIN_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G2H_ADMIN_FIXTURES === "1";

export default function ReportsClientParts({
  state,
}: {
  state: ReportsClientState;
}) {
  const locale = localeFromPath(usePathname());
  const { loader, t } = useRouteTranslations();
  const i18nValue = useMemo(
    () => ({ locale, path: (href: string) => localizedPath(href, locale), t }),
    [locale, t],
  );

  return (
    <ReportsI18nContext.Provider value={i18nValue}>
      {loader}
      <PageShell
        className={`admin-page-shell min-h-screen ${REPORT_METRIC_CLASSES.shellTopSpacing} ${state.kind === "ready" ? "" : "admin-gate-shell"}`}
        headerClassName="admin-shell-header"
        eyebrow={
          <span className="inline-flex items-center gap-paw-xs">
            <PawIcon name="shield" className="h-paw-md w-paw-md" aria-hidden="true" />
            {t("adminReportsEyebrow")}
          </span>
        }
        title={t("adminReportsTitle")}
        description={t("adminReportsDescription")}
        actions={
          <>
            <Link
              href={i18nValue.path("/")}
              className={buttonClassName({ variant: "secondary" })}
            >
              <PawIcon name="back" className="h-paw-md w-paw-md" aria-hidden="true" />
              {t("adminReportsHome")}
            </Link>
            <Link
              href={i18nValue.path("/admin/park-risks")}
              className={buttonClassName({ variant: "ghost" })}
            >
              {t("adminReportsParkRisks")}
            </Link>
          </>
        }
      >
        <ReportsClientBody state={state} />
      </PageShell>
    </ReportsI18nContext.Provider>
  );
}

function ReportsClientBody({ state }: { state: ReportsClientState }) {
  if (ADMIN_FIXTURES_ENABLED) {
    return (
      <ReportsQueue
        payload={loadP3B1g2hAdminFixtures().reports}
        fixtureMode
        account={null}
      />
    );
  }

  return <LiveReportsClientParts state={state} />;
}

function LiveReportsClientParts({ state }: { state: ReportsClientState }) {
  const router = useRouter();
  const { t, locale, path } = useReportsI18n();
  const { loading: authLoading, session, user, authGeneration, getSessionForGeneration } = useAuth();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const needsSession =
    state.kind === "needs-session" || state.kind === "session-expired" ||
    ((state.kind === "ready" || state.kind === "forbidden") &&
      !authLoading && state.viewerId !== user?.id);
  const bridgePage = state.page;
  // Cookie-setting actions refresh the server translation object. Depend on
  // its actual values, not new function identities that restart this request.
  const signInTarget = path("/auth?next=" + encodeURIComponent(path("/admin/reports")));
  const bridgeTarget = path(bridgePage > 1 ? `/admin/reports?page=${bridgePage}` : "/admin/reports");
  const verificationError = t("adminReportsUnableToVerifySession");

  useEffect(() => {
    if (!needsSession) return;
    if (authLoading) return;

    let cancelled = false;

    if (!session?.access_token) {
      const timer = window.setTimeout(() => {
        const redirectToSignIn = () => {
          if (!cancelled) {
            router.replace(signInTarget);
          }
        };

        clearAdminReportsSession()
          .catch(() => undefined)
          .finally(redirectToSignIn);
      }, SESSION_REDIRECT_DELAY_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const current = getSessionForGeneration(authGeneration);
    if (!current) return;
    const resetErrorTimer = window.setTimeout(() => {
      if (!cancelled) setSessionError(null);
    }, 0);
    syncAdminReportsSession(current.access_token, locale)
      .then((result) => {
        if (cancelled || !getSessionForGeneration(authGeneration)) return;
        if (!result.ok || !result.allowed) {
          setSessionError(result.message);
          return;
        }
        window.location.replace(bridgeTarget);
      })
      .catch((error: unknown) => {
        if (cancelled || !getSessionForGeneration(authGeneration)) return;
        setSessionError(
          error instanceof Error
            ? error.message
            : verificationError,
        );
      });

    return () => {
      cancelled = true;
      window.clearTimeout(resetErrorTimer);
    };
  }, [
    authLoading,
    authGeneration,
    getSessionForGeneration,
    needsSession,
    router,
    session?.access_token,
    bridgeTarget,
    locale,
    signInTarget,
    verificationError,
  ]);

  if (authLoading || needsSession) {
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

  if (state.kind === "error" || state.kind === "forbidden") {
    return (
      <ErrorPanel
        message={state.message}
        onRetry={() => router.refresh()}
      />
    );
  }

  return (
    <LiveReportsQueue
      key={`${authGeneration}:${state.viewerId}:${state.page}`}
      viewerId={state.viewerId}
      page={state.page}
      generation={authGeneration}
    />
  );
}

// A page cookie may outlive a browser account transition. The server shell
// contains no report payload; only this explicit, generation-bound read can
// obtain it, and old reads cannot populate a later account or an A-B-A page.
function LiveReportsQueue({ viewerId, page, generation }: {
  viewerId: string;
  page: number;
  generation: number;
}) {
  const { getSessionForGeneration } = useAuth();
  const { path, t } = useReportsI18n();
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{
    payload: ReportsPagePayload | null;
    error: string | null;
  } | null>(null);
  const account = useMemo(() => ({
    ownerId: viewerId,
    token: () => {
      const current = getSessionForGeneration(generation);
      return current?.user.id === viewerId ? current.access_token : null;
    },
  }), [viewerId, generation, getSessionForGeneration]);

  useEffect(() => {
    let cancelled = false;
    const token = account.token();
    if (!token) return;
    loadReportsAction(token, page)
      .then((result) => {
        if (cancelled || !account.token()) return;
        if (!result.ok || result.viewerId !== viewerId) {
          setLoaded({ payload: null, error: result.ok
            ? t("adminReportsUnableToVerifySession") : result.message });
          return;
        }
        if (result.payload.page !== page) {
          const query = result.payload.page > 1 ? `?page=${result.payload.page}` : "";
          router.replace(path(`/admin/reports${query}`), { scroll: false });
        }
        setLoaded({ payload: result.payload, error: null });
      })
      .catch(() => {
        if (cancelled || !account.token()) return;
        setLoaded({ payload: null, error: t("adminReportsUnableToLoad") });
      });
    return () => { cancelled = true; };
  }, [account, page, path, revision, router, t, viewerId]);

  if (!account.token() || !loaded) {
    return <LoadingState title={t("adminReportsCheckingAccess")}
      description={t("adminReportsLoadingDescription")} />;
  }
  if (!loaded.payload) {
    return <ErrorPanel message={loaded.error ?? t("adminReportsUnableToLoad")}
      onRetry={() => {
        if (!account.token()) return;
        setLoaded(null);
        setRevision((value) => value + 1);
      }} />;
  }
  return <ReportsQueue payload={loaded.payload} fixtureMode={false} account={account}
    onRefresh={() => {
      if (!account.token()) return;
      setLoaded(null);
      setRevision((value) => value + 1);
    }} />;
}

type ReportsAccountScope = { ownerId: string; token: () => string | null };

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
  const { path, t } = useReportsI18n();
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
          title={t("adminReportsCheckingAccess")}
          description={
            email
              ? `${t("adminReportsVerifyingPermissionsPrefix")} ${email}.`
              : t("adminReportsVerifyingSession")
          }
        />
      </section>
    );
  }

  return (
    <section className="admin-gate-panel">
      <div>
        <p className="text-paw-type-h3 font-extrabold text-paw-ink">
          {t("adminReportsSignInRequired")}
        </p>
        <p className="mt-paw-xs text-paw-type-body leading-6 text-paw-body">
          {message ??
            t("adminReportsSignInDescription")}
        </p>
      </div>
        <Link
          href={path("/auth?next=" + encodeURIComponent(path("/admin/reports")))}
          className={buttonClassName({ variant: "primary" })}
        >
          {t("adminReportsSignIn")}
        </Link>
    </section>
  );
}

function ReportsQueue({
  payload,
  fixtureMode,
  account,
  onRefresh,
}: {
  payload: ReportsPagePayload;
  fixtureMode: boolean;
  account: ReportsAccountScope | null;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const { t } = useReportsI18n();
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
  const mountedRef = useRef(false);
  const flightRef = useRef<symbol | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      flightRef.current = null;
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
      if (!mountedRef.current || !account?.token()) return;
      startTransition(() => {
        if (onRefresh) onRefresh();
        else router.refresh();
      });
    }, ACTION_REFRESH_DELAY_MS);
  }

  async function resolveReport(
    report: PendingReportView,
    action: ReportResolutionAction,
  ) {
    if (fixtureMode || !account || flightRef.current) return;
    const token = account.token();
    if (!token) return;
    const attempt = Symbol("report-action");
    flightRef.current = attempt;
    const isCurrent = () => mountedRef.current &&
      flightRef.current === attempt && Boolean(account.token());
    setBusy({ reportId: report.id, action });
    setToast(null);

    try {
      const result = await resolveReportAction(report.id, action, token, account.ownerId);
      if (!isCurrent()) return;
      if (result.ok) {
        setResolvedReportIds((current) => {
          const next = new Set(current);
          next.add(report.id);
          return next;
        });
        setToast({ tone: "success", title: t(actionLabelKeys[action]), text: result.message });
        setConfirmation(null);
        scheduleRefresh();
      } else {
        setToast({ tone: "critical", title: t("adminReportsActionFailed"), text: result.message });
      }
    } catch {
      if (!isCurrent()) return;
      // A rejected/unknown Server Action keeps the item available for explicit
      // retry. Never optimistically remove it or automatically submit again.
      setToast({ tone: "critical", title: t("adminReportsActionFailed"), text: t("adminReportsRetry") });
    } finally {
      if (flightRef.current === attempt) {
        flightRef.current = null;
        if (mountedRef.current && account.token()) setBusy(null);
      }
    }
  }

  // Resolving the final item on a later page does not empty the whole queue.
  // Keep the refresh interval neutral until the server returns a valid page.
  if (reports.length === 0 && displayPayload.total > 0) {
    return <LoadingState title={t("adminReportsCheckingAccess")}
      description={t("adminReportsLoadingDescription")} />;
  }

  return (
    <div className="space-y-paw-xl">
      <div className="grid grid-cols-2 gap-paw-sm lg:grid-cols-4">
        <MetricTile className="admin-card-upgraded" label={t("adminReportsPending")} value={displayPayload.total} tone="warning" />
        <MetricTile className="admin-card-upgraded" label={t("adminReportsPosts")} value={counts.post} tone="primary" />
        <MetricTile className="admin-card-upgraded" label={t("adminReportsComments")} value={counts.comment} tone="trust" />
        <MetricTile className="admin-card-upgraded" label={t("adminReportsUsers")} value={counts.user} tone="critical" />
      </div>

      {toast && (
        <StatusMessage tone={toast.tone} title={toast.title}>
          {toast.text}
        </StatusMessage>
      )}

      <Card className="admin-card-upgraded">
        <CardContent className="space-y-paw-lg">
          <div className="flex flex-col gap-paw-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-paw-type-h2 font-extrabold text-paw-ink">
                {t("adminReportsPendingQueue")}
              </h2>
              <p className="mt-paw-xxs text-paw-type-body leading-6 text-paw-body">
                {t("adminReportsNewestPrefix")} {payload.pageSize} {t("adminReportsNewestSuffix")}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (fixtureMode) router.refresh();
                else if (account?.token()) onRefresh?.();
              }}
            >
              <PawIcon name="refresh" className="h-paw-md w-paw-md" aria-hidden="true" />
              {t("adminReportsRefresh")}
            </Button>
          </div>

          {reports.length === 0 ? (
            <EmptyState
              icon={FileApprovedEmptyStateIcon}
              title={t("adminReportsEmptyTitle")}
              description={t("adminReportsEmptyDescription")}
            />
          ) : (
            <div className="space-y-paw-md">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  busy={busy?.reportId === report.id ? busy.action : null}
                  onDismiss={() => resolveReport(report, "dismissed")}
                  onConfirm={(action) => {
                    if (!fixtureMode && !account?.token()) return;
                    setConfirmation({ report, action });
                  }}
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
  const { locale, t } = useReportsI18n();
  const canRemoveContent =
    report.targetType !== "user" && report.target.type !== "missing";
  const disabled = Boolean(busy);

  return (
    <article className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-paw-md">
      <div className="flex flex-col gap-paw-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-paw-xs">
          <div className="flex flex-wrap items-center gap-paw-xs">
            <Badge tone={targetBadgeTone(report.targetType)}>
              {t(targetTypeLabelKeys[report.targetType])}
            </Badge>
            <Badge tone="warning">{t("adminReportsPending")}</Badge>
            <span className="text-paw-type-caption font-bold text-paw-muted">
              {formatDate(report.createdAt, locale)}
            </span>
          </div>
          <h3 className="text-paw-type-h3 font-extrabold leading-tight text-paw-ink">
            {report.reason}
          </h3>
          <p className="break-all text-paw-type-caption font-semibold text-paw-muted">
            {t("adminReportsReport")} {report.id}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-paw-xs sm:grid-cols-2 lg:min-w-[340px]">
          <ProfileChip label={t("adminReportsReporter")} profile={report.reporter} />
          <ProfileChip label={t("adminReportsReportedUser")} profile={report.reportedUser} />
        </div>
      </div>

      <div className="mt-paw-md">
        <TargetPreview target={report.target} />
      </div>

      {!canRemoveContent && report.targetType === "user" && (
        <p className="mt-paw-sm text-paw-type-caption font-semibold text-paw-muted">
          {t("adminReportsUserRemovalHint")}
        </p>
      )}

      <div className="mt-paw-md flex flex-col gap-paw-xs border-t border-paw-border pt-paw-md sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onDismiss}
          disabled={disabled}
        >
          {busy === "dismissed" ? (
            <PawIcon name="spinner" className="h-paw-md w-paw-md animate-spin" aria-hidden="true" />
          ) : (
            <PawIcon name="success" className="h-paw-md w-paw-md" aria-hidden="true" />
          )}
          {t("adminReportsDismiss")}
        </Button>
        <Button
          type="button"
          variant="critical"
          className="w-full sm:w-auto"
          onClick={() => onConfirm("content_removed")}
          disabled={disabled || !canRemoveContent}
          title={
            canRemoveContent
              ? undefined
              : t("adminReportsRemoveContentUnavailable")
          }
        >
          {busy === "content_removed" ? (
            <PawIcon name="spinner" className="h-paw-md w-paw-md animate-spin" aria-hidden="true" />
          ) : (
            <PawIcon name="delete" className="h-paw-md w-paw-md" aria-hidden="true" />
          )}
          {t("adminReportsRemoveContent")}
        </Button>
        <Button
          type="button"
          variant="critical"
          className="w-full sm:w-auto"
          onClick={() => onConfirm("user_banned")}
          disabled={disabled}
        >
          {busy === "user_banned" ? (
            <PawIcon name="spinner" className="h-paw-md w-paw-md animate-spin" aria-hidden="true" />
          ) : (
            <PawIcon name="ban" className="h-paw-md w-paw-md" aria-hidden="true" />
          )}
          {t("adminReportsBanUser")}
        </Button>
      </div>
    </article>
  );
}

function TargetPreview({ target }: { target: ReportTargetSummary }) {
  const { locale, t } = useReportsI18n();
  if (target.type === "missing") {
    return (
      <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft p-paw-md">
        <div className="flex items-start gap-paw-sm">
          <PawIcon
            name="warning"
            className="mt-0.5 h-paw-lg w-paw-lg flex-none text-paw-warning"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-extrabold text-paw-ink">{target.label}</p>
            <p className="mt-paw-xxs break-all text-paw-type-body leading-6 text-paw-body">
              {t("adminReportsTargetId")} {target.id ?? t("adminReportsNotProvided")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (target.type === "post") {
    return (
      <div className="grid gap-paw-md rounded-paw-md border border-paw-border bg-paw-panel p-paw-md md:grid-cols-[112px_minmax(0,1fr)]">
        <MediaThumb imageUrl={target.imageUrl} label={t("adminReportsReportedPostImage")} />
        <div className="min-w-0">
          <TargetHeader
            icon={<PawIcon name="document" className="h-paw-md w-paw-md" aria-hidden="true" />}
            title={t("adminReportsReportedPost")}
            removedAt={target.removedAt}
          />
          <p className="mt-paw-xs text-paw-type-body leading-6 text-paw-body">
            {target.bodyPreview}
          </p>
          <TargetMeta>
            <span>{t("adminReportsAuthor")} {target.author?.displayName ?? t("adminReportsUnknownUser")}</span>
            <span>{t("adminReportsCreated")} {formatNullableDate(target.createdAt, locale, t)}</span>
            <span className="break-all">{t("adminReportsTargetPost")} {target.id}</span>
          </TargetMeta>
        </div>
      </div>
    );
  }

  if (target.type === "comment") {
    return (
      <div className="rounded-paw-md border border-paw-border bg-paw-panel p-paw-md">
        <TargetHeader
          icon={<PawIcon name="comment" className="h-paw-md w-paw-md" aria-hidden="true" />}
          title={t("adminReportsReportedComment")}
          removedAt={target.removedAt}
        />
        <blockquote className="mt-paw-sm border-l-4 border-paw-primary/30 pl-paw-md text-paw-type-body leading-6 text-paw-body">
          {target.bodyPreview}
        </blockquote>
        <TargetMeta>
          <span>{t("adminReportsAuthor")} {target.author?.displayName ?? t("adminReportsUnknownUser")}</span>
          <span>{t("adminReportsCreated")} {formatNullableDate(target.createdAt, locale, t)}</span>
          {target.contentId && (
            <span className="break-all">{t("adminReportsParentPost")} {target.contentId}</span>
          )}
          <span className="break-all">{t("adminReportsTargetComment")} {target.id}</span>
        </TargetMeta>
      </div>
    );
  }

  return (
    <div className="rounded-paw-md border border-paw-border bg-paw-panel p-paw-md">
      <TargetHeader
        icon={<PawIcon name="profile" className="h-paw-md w-paw-md" aria-hidden="true" />}
        title={t("adminReportsReportedUser")}
      />
      <div className="mt-paw-md">
        <ProfileChip label={t("adminReportsAccount")} profile={target.profile} large />
      </div>
      <p className="mt-paw-sm break-all text-paw-type-caption font-semibold text-paw-muted">
        {t("adminReportsTargetUser")} {target.id}
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
  const { t } = useReportsI18n();
  const copy =
    confirmation.action === "content_removed"
      ? {
          title: t("adminReportsRemoveDialogTitle"),
          text: t("adminReportsRemoveDialogDescription"),
          button: t("adminReportsRemoveContent"),
          icon: "delete" as const,
        }
      : {
          title: t("adminReportsBanDialogTitle"),
          text: t("adminReportsBanDialogDescription"),
          button: t("adminReportsBanUser"),
          icon: "ban" as const,
        };
  const isBusy = busy === confirmation.action;

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-paw-ink/45 px-paw-md py-paw-xl">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-confirm-title"
        className="w-full max-w-lg rounded-paw-lg border border-paw-border bg-paw-panel p-paw-lg shadow-paw-panel"
      >
        <div className="flex items-start justify-between gap-paw-md">
          <div className="flex items-start gap-paw-sm">
            <span className="flex h-paw-xxxl w-paw-xxxl flex-none items-center justify-center rounded-paw-md bg-paw-critical-soft text-paw-on-critical-soft">
              <PawIcon name={copy.icon} className="h-paw-lg w-paw-lg" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="report-confirm-title"
                className="text-paw-type-h2 font-extrabold text-paw-ink"
              >
                {copy.title}
              </h2>
              <p className="mt-paw-xs text-paw-type-body leading-6 text-paw-body">
                {copy.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-paw-sm p-paw-xs text-paw-muted transition hover:bg-paw-panel-subtle hover:text-paw-ink"
            aria-label={t("adminReportsCloseConfirmation")}
            disabled={isBusy}
          >
            <PawIcon name="close" className="h-paw-lg w-paw-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-paw-lg rounded-paw-md border border-paw-border bg-paw-panel-subtle p-paw-sm">
          <p className="text-paw-type-caption font-extrabold uppercase tracking-wide text-paw-muted">
            {t("adminReportsReportReason")}
          </p>
          <p className="mt-paw-xxs text-paw-type-body font-bold text-paw-ink">
            {confirmation.report.reason}
          </p>
        </div>

        <div className="mt-paw-lg flex flex-col-reverse gap-paw-xs sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {t("adminReportsCancel")}
          </Button>
          <Button
            type="button"
            variant="critical"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? (
              <PawIcon name="spinner" className="h-paw-md w-paw-md animate-spin" aria-hidden="true" />
            ) : (
              <PawIcon name={copy.icon} className="h-paw-md w-paw-md" aria-hidden="true" />
            )}
            {copy.button}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  payload,
  currentCount,
}: {
  payload: ReportsPagePayload;
  currentCount: number;
}) {
  const { path, t } = useReportsI18n();
  if (payload.totalPages <= 1 && currentCount === payload.total) return null;

  const previousHref =
    payload.page <= 2 ? path("/admin/reports") : path(`/admin/reports?page=${payload.page - 1}`);
  const nextHref = path(`/admin/reports?page=${payload.page + 1}`);

  return (
    <nav
      className="flex flex-col gap-paw-sm border-t border-paw-border pt-paw-md sm:flex-row sm:items-center sm:justify-between"
      aria-label={t("adminReportsPagination")}
    >
      <p className="text-paw-type-body font-semibold text-paw-muted">
        {t("adminReportsPage")} {payload.page} {t("adminReportsOf")} {payload.totalPages} · {payload.total} {t("adminReportsPendingTotal")}
      </p>
      <div className="flex gap-paw-xs">
        {payload.hasPrevious ? (
          <Link
            href={previousHref}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            <PawIcon name="chevronLeft" className="h-paw-md w-paw-md" aria-hidden="true" />
            {t("adminReportsPrevious")}
          </Link>
        ) : (
          <span
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            <PawIcon name="chevronLeft" className="h-paw-md w-paw-md" aria-hidden="true" />
            {t("adminReportsPrevious")}
          </span>
        )}
        {payload.hasNext ? (
          <Link
            href={nextHref}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            {t("adminReportsNext")}
            <PawIcon name="chevronRight" className="h-paw-md w-paw-md" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className={buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "pointer-events-none opacity-50",
            })}
          >
            {t("adminReportsNext")}
            <PawIcon name="chevronRight" className="h-paw-md w-paw-md" aria-hidden="true" />
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
  const { t } = useReportsI18n();
  return (
    <div
      className={cn(
        "min-w-0 rounded-paw-md border border-paw-border bg-paw-panel p-paw-sm",
        large && "max-w-md",
      )}
    >
      <p className="text-paw-type-caption font-extrabold uppercase tracking-wide text-paw-muted">
        {label}
      </p>
      <div className="mt-paw-xs flex min-w-0 items-center gap-paw-sm">
        <Avatar profile={profile} size={large ? 44 : 36} />
        <div className="min-w-0">
          <p className="truncate text-paw-type-body font-extrabold text-paw-ink">
            {profile?.displayName ?? t("adminReportsUnknownUser")}
          </p>
          <p className="truncate text-paw-type-caption font-semibold text-paw-muted">
            {profile?.username ? `@${profile.username}` : profile?.id ?? t("adminReportsNoProfile")}
          </p>
        </div>
        {profile?.bannedAt && (
          <Badge tone="critical" className="ml-auto">
            {t("adminReportsBanned")}
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
        <PawIcon
          name="profile"
          className="absolute inset-1/2 h-paw-lg w-paw-lg -translate-x-1/2 -translate-y-1/2"
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
    <div className={`relative ${REPORT_METRIC_CLASSES.previewMediaSize} w-full overflow-hidden rounded-paw-md bg-paw-primary-soft`}>
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
        <PawIcon
          name="document"
          className="absolute inset-1/2 h-paw-xxl w-paw-xxl -translate-x-1/2 -translate-y-1/2 text-paw-primary"
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
  const { t } = useReportsI18n();
  return (
    <div className="flex flex-wrap items-center gap-paw-xs">
      <span className="inline-flex items-center gap-paw-xs text-paw-type-body font-extrabold text-paw-ink">
        {icon}
        {title}
      </span>
      {removedAt && <Badge tone="neutral">{t("adminReportsAlreadyRemoved")}</Badge>}
    </div>
  );
}

function TargetMeta({ children }: { children: ReactNode }) {
  return (
    <div className="mt-paw-sm flex flex-wrap gap-x-paw-md gap-y-paw-xxs text-paw-type-caption font-semibold text-paw-muted">
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
  const { t } = useReportsI18n();
  return (
    <section className="admin-gate-panel">
      <div>
        <p className="text-paw-type-h3 font-extrabold text-paw-ink">
          {t("adminReportsUnableToLoad")}
        </p>
        <p className="mt-paw-xs text-paw-type-body leading-6 text-paw-body">
          {message}
        </p>
      </div>
        <Button type="button" variant="secondary" onClick={onRetry}>
          <PawIcon name="refresh" className="h-paw-md w-paw-md" aria-hidden="true" />
          {t("adminReportsRetry")}
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
    <div className={`flex ${REPORT_METRIC_CLASSES.emptyStateMinHeight} flex-col items-center justify-center text-center`}>
      <PawIcon
        name="spinner"
        className="h-paw-xxl w-paw-xxl animate-spin text-paw-primary"
        aria-hidden="true"
      />
      <p className="mt-paw-md text-paw-type-h3 font-extrabold text-paw-ink">{title}</p>
      <p className="mt-paw-xs max-w-md text-paw-type-body leading-6 text-paw-body">
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
      return "critical";
  }
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNullableDate(
  value: string | null,
  locale: string,
  t: ReportsTranslation,
) {
  if (!value) return t("adminReportsUnknown");
  return formatDate(value, locale);
}
