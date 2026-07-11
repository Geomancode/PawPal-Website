"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadP3B1g2hAdminFixtures } from "@/lib/p3b1g2hAdminFixtures";
import { useAuth } from "@/components/AuthProvider";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { localeFromPath, localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages/en";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  PageShell,
  StatusMessage,
} from "@/components/ui";

type RiskStatus =
  | "pending_confirmation"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "archived";

type RiskType =
  | "toxic_plants"
  | "wildlife"
  | "water_terrain"
  | "construction_closure"
  | "sanitation_pollution"
  | "other";

type Severity = "info" | "caution" | "high";
type SourceType = "community" | "official";

type ParkRiskReport = {
  id: string;
  place_id: string;
  place_name: string;
  place_address: string | null;
  latitude: number | null;
  longitude: number | null;
  risk_type: RiskType;
  severity: Severity;
  title: string;
  description: string;
  evidence_url: string | null;
  source_type: SourceType;
  official_source_name: string | null;
  official_source_url: string | null;
  status: RiskStatus;
  confirmation_count: number;
  reporter_id: string | null;
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  highlighted_at: string | null;
  created_at: string;
  updated_at: string;
};

type Message = {
  tone: "success" | "danger" | "warning";
  text: string;
};

type AdminCheckResult = {
  allowed: boolean;
  unavailableReason: string | null;
};

type OfficialRiskForm = {
  placeId: string;
  placeName: string;
  placeAddress: string;
  riskType: RiskType;
  severity: Severity;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  evidenceUrl: string;
};

const RISK_SELECT = [
  "id",
  "place_id",
  "place_name",
  "place_address",
  "latitude",
  "longitude",
  "risk_type",
  "severity",
  "title",
  "description",
  "evidence_url",
  "source_type",
  "official_source_name",
  "official_source_url",
  "status",
  "confirmation_count",
  "reporter_id",
  "reviewer_id",
  "review_note",
  "reviewed_at",
  "highlighted_at",
  "created_at",
  "updated_at",
].join(",");

const ADMIN_FIXTURES_ENABLED =
  process.env.NEXT_PUBLIC_P3B1G2H_ADMIN_FIXTURES === "1";

type ParkRiskTranslation = ReturnType<typeof useRouteTranslations>["t"];

const riskTypeLabelKeys: Record<RiskType, MessageKey> = {
  toxic_plants: "adminParkRisksTypeToxicPlants",
  wildlife: "adminParkRisksTypeWildlife",
  water_terrain: "adminParkRisksTypeWaterTerrain",
  construction_closure: "adminParkRisksTypeConstructionClosure",
  sanitation_pollution: "adminParkRisksTypeSanitationPollution",
  other: "adminParkRisksTypeOther",
};

const severityLabelKeys: Record<Severity, MessageKey> = {
  info: "adminParkRisksSeverityInfo",
  caution: "adminParkRisksSeverityCaution",
  high: "adminParkRisksSeverityHigh",
};

const statusLabelKeys: Record<RiskStatus, MessageKey> = {
  pending_confirmation: "adminParkRisksStatusAwaitingConfirmations",
  ready_for_review: "adminParkRisksStatusReadyForReview",
  approved: "adminParkRisksStatusHighlighted",
  rejected: "adminParkRisksStatusRejected",
  archived: "adminParkRisksStatusArchived",
};

const riskTypeOptions = Object.entries(riskTypeLabelKeys) as [RiskType, MessageKey][];
const severityOptions = Object.entries(severityLabelKeys) as [Severity, MessageKey][];

const initialOfficialForm: OfficialRiskForm = {
  placeId: "",
  placeName: "",
  placeAddress: "",
  riskType: "construction_closure",
  severity: "caution",
  title: "",
  description: "",
  sourceName: "City of Ghent",
  sourceUrl: "",
  evidenceUrl: "",
};

function previewReports(t: ParkRiskTranslation): ParkRiskReport[] {
  return [
  {
    id: "preview-risk-1",
    place_id: "preview-google-place-id-1",
    place_name: "Preview park",
    place_address: "Preview address, 9000 Gent",
    latitude: 51.0543,
    longitude: 3.7174,
    risk_type: "water_terrain",
    severity: "caution",
    title: t("adminParkRisksPreviewSlipperyTitle"),
    description: t("adminParkRisksPreviewSlipperyDescription"),
    evidence_url: null,
    source_type: "community",
    official_source_name: null,
    official_source_url: null,
    status: "ready_for_review",
    confirmation_count: 3,
    reporter_id: "preview-reporter",
    reviewer_id: null,
    review_note: null,
    reviewed_at: null,
    highlighted_at: null,
    created_at: "2026-06-07T12:00:00.000Z",
    updated_at: "2026-06-07T12:20:00.000Z",
  },
  {
    id: "preview-risk-2",
    place_id: "preview-google-place-id-2",
    place_name: "Preview dog area",
    place_address: "Preview lane, 9000 Gent",
    latitude: 51.0492,
    longitude: 3.7284,
    risk_type: "wildlife",
    severity: "info",
    title: t("adminParkRisksPreviewAwaitingTitle"),
    description: t("adminParkRisksPreviewAwaitingDescription"),
    evidence_url: null,
    source_type: "community",
    official_source_name: null,
    official_source_url: null,
    status: "pending_confirmation",
    confirmation_count: 1,
    reporter_id: "preview-reporter",
    reviewer_id: null,
    review_note: null,
    reviewed_at: null,
    highlighted_at: null,
    created_at: "2026-06-07T11:00:00.000Z",
    updated_at: "2026-06-07T11:15:00.000Z",
  },
  ];
}

async function checkPawPalAdmin(): Promise<AdminCheckResult> {
  const { data, error } = await supabase.rpc("is_pawpal_admin");
  if (error) {
    return {
      allowed: false,
      unavailableReason: error.message,
    };
  }
  return {
    allowed: Boolean(data),
    unavailableReason: null,
  };
}

function statusTone(status: RiskStatus) {
  switch (status) {
    case "approved":
      return "success";
    case "ready_for_review":
      return "warning";
    case "rejected":
    case "archived":
      return "neutral";
    case "pending_confirmation":
      return "trust";
  }
}

function severityTone(severity: Severity) {
  switch (severity) {
    case "high":
      return "danger";
    case "caution":
      return "warning";
    case "info":
      return "trust";
  }
}

function formatDate(
  value: string | null,
  locale: Locale,
  t: ParkRiskTranslation,
) {
  if (!value) return t("adminParkRisksNotReviewed");
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ParkRiskAdminPage() {
  const router = useRouter();
  const locale = localeFromPath(usePathname());
  const path = (href: string) => localizedPath(href, locale);
  const { loader, t } = useRouteTranslations();
  const { user, loading: authLoading } = useAuth();
  const [adminCheck, setAdminCheck] = useState<{
    email: string | null;
    allowed: boolean;
    unavailableReason: string | null;
    checking: boolean;
  }>({
    email: null,
    allowed: false,
    unavailableReason: null,
    checking: false,
  });
  const [reports, setReports] = useState<ParkRiskReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [queueFallbackReason, setQueueFallbackReason] = useState<string | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Message | null>(null);
  const [statusFilter, setStatusFilter] = useState<"queue" | RiskStatus>(
    "queue",
  );
  const [officialForm, setOfficialForm] =
    useState<OfficialRiskForm>(initialOfficialForm);
  const [creatingOfficial, setCreatingOfficial] = useState(false);
  const currentAdminEmail = user?.email ?? null;
  const adminCheckStale = Boolean(
    currentAdminEmail && adminCheck.email !== currentAdminEmail,
  );
  const checkingAdmin = Boolean(
    currentAdminEmail && (adminCheck.checking || adminCheckStale),
  );
  const isAdmin = Boolean(
    currentAdminEmail &&
      adminCheck.email === currentAdminEmail &&
      adminCheck.allowed,
  );
  const adminPreviewMode = Boolean(
    currentAdminEmail &&
      adminCheck.email === currentAdminEmail &&
      !adminCheck.allowed &&
      adminCheck.unavailableReason,
  );
  const queueReadOnly =
    ADMIN_FIXTURES_ENABLED || adminPreviewMode || Boolean(queueFallbackReason);
  const canViewQueue = ADMIN_FIXTURES_ENABLED || isAdmin || adminPreviewMode;

  const refreshReports = useCallback(async () => {
    setLoadingReports(true);
    if (ADMIN_FIXTURES_ENABLED) {
      setReports(loadP3B1g2hAdminFixtures().parkRisks);
      setQueueFallbackReason(null);
      setLoadingReports(false);
      return;
    }
    if (adminPreviewMode) {
      setReports(previewReports(t));
      setQueueFallbackReason(
        adminCheck.unavailableReason ?? t("adminParkRisksAdminCheckUnavailable"),
      );
      setLoadingReports(false);
      return;
    }

    const { data, error } = await supabase
      .from("park_risk_reports")
      .select(RISK_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage({
        tone: "warning",
        text: `${t("adminParkRisksQueueUnavailablePrefix")} ${error.message}`,
      });
      setQueueFallbackReason(error.message);
      setReports(previewReports(t));
    } else {
      setQueueFallbackReason(null);
      setReports((data ?? []) as unknown as ParkRiskReport[]);
    }
    setLoadingReports(false);
  }, [adminCheck.unavailableReason, adminPreviewMode, t]);

  useEffect(() => {
    let cancelled = false;
    if (ADMIN_FIXTURES_ENABLED) return;
    if (authLoading) return;
    if (!currentAdminEmail) return;
    const timer = window.setTimeout(() => {
      setAdminCheck({
        email: currentAdminEmail,
        allowed: false,
        unavailableReason: null,
        checking: true,
      });
      checkPawPalAdmin().then((result) => {
        if (cancelled) return;
        setAdminCheck({
          email: currentAdminEmail,
          allowed: result.allowed,
          unavailableReason: result.unavailableReason,
          checking: false,
        });
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authLoading, currentAdminEmail]);

  useEffect(() => {
    if (!canViewQueue) return;
    const timer = window.setTimeout(() => {
      void refreshReports();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [canViewQueue, refreshReports]);

  const counts = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.total += 1;
        acc[report.status] += 1;
        if (
          report.status === "pending_confirmation" ||
          report.status === "ready_for_review"
        ) {
          acc.queue += 1;
        }
        return acc;
      },
      {
        total: 0,
        queue: 0,
        pending_confirmation: 0,
        ready_for_review: 0,
        approved: 0,
        rejected: 0,
        archived: 0,
      } satisfies Record<RiskStatus | "queue" | "total", number>,
    );
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (statusFilter === "queue") {
      return reports.filter(
        (report) =>
          report.status === "ready_for_review" ||
          report.status === "pending_confirmation",
      );
    }
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  function updateOfficialForm<K extends keyof OfficialRiskForm>(
    key: K,
    value: OfficialRiskForm[K],
  ) {
    setOfficialForm((current) => ({ ...current, [key]: value }));
  }

  async function handleReview(report: ParkRiskReport, decision: "approved" | "rejected") {
    if (queueReadOnly) {
      setMessage({
        tone: "warning",
        text: t("adminParkRisksReviewReadOnlyMessage"),
      });
      return;
    }

    setBusyId(report.id);
    setMessage(null);
    const { error } = await supabase.rpc("admin_review_park_risk", {
      p_report_id: report.id,
      p_decision: decision,
      p_review_note: notes[report.id] ?? null,
    });

    if (error) {
      setMessage({
        tone: "danger",
        text: error.message,
      });
    } else {
      setMessage({
        tone: "success",
        text:
          decision === "approved"
            ? t("adminParkRisksApprovedMessage")
            : t("adminParkRisksRejectedMessage"),
      });
      setNotes((current) => ({ ...current, [report.id]: "" }));
      await refreshReports();
    }
    setBusyId(null);
  }

  async function handleCreateOfficialRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (queueReadOnly) {
      setMessage({
        tone: "warning",
        text: t("adminParkRisksOfficialReadOnlyMessage"),
      });
      return;
    }

    if (!user) return;
    if (
      !officialForm.placeId.trim() ||
      !officialForm.placeName.trim() ||
      !officialForm.title.trim() ||
      !officialForm.description.trim() ||
      !officialForm.sourceName.trim() ||
      !officialForm.sourceUrl.trim()
    ) {
      setMessage({
        tone: "danger",
        text: t("adminParkRisksRequiredFieldsMessage"),
      });
      return;
    }

    setCreatingOfficial(true);
    setMessage(null);
    const now = new Date().toISOString();
    const { error } = await supabase.from("park_risk_reports").insert({
      place_id: officialForm.placeId.trim(),
      place_name: officialForm.placeName.trim(),
      place_address: officialForm.placeAddress.trim() || null,
      risk_type: officialForm.riskType,
      severity: officialForm.severity,
      title: officialForm.title.trim(),
      description: officialForm.description.trim(),
      evidence_url: normalizeOptionalUrl(officialForm.evidenceUrl),
      source_type: "official",
      official_source_name: officialForm.sourceName.trim(),
      official_source_url: officialForm.sourceUrl.trim(),
      status: "approved",
      confirmation_count: 3,
      reporter_id: user.id,
      reviewer_id: user.id,
      reviewed_at: now,
      highlighted_at: now,
      review_note: t("adminParkRisksOfficialVerifiedNote"),
    });

    if (error) {
      setMessage({
        tone: "danger",
        text: error.message,
      });
    } else {
      setMessage({
        tone: "success",
        text: t("adminParkRisksOfficialAddedMessage"),
      });
      setOfficialForm(initialOfficialForm);
      await refreshReports();
    }
    setCreatingOfficial(false);
  }

  if (!ADMIN_FIXTURES_ENABLED && (authLoading || checkingAdmin)) {
    return (
      <>
        {loader}
        <div className="flex min-h-screen items-center justify-center bg-paw-page pt-24 text-paw-ink">
          <Loader2 className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
        </div>
      </>
    );
  }

  if (!ADMIN_FIXTURES_ENABLED && !user) {
    return (
      <>
        {loader}
        <PageShell
        className="admin-page-shell admin-gate-shell min-h-screen pt-28"
        eyebrow={t("adminParkRisksEyebrow")}
        title={t("adminParkRisksSignInRequired")}
        description={t("adminParkRisksSignInDescription")}
        actions={
          <Button type="button" onClick={() => router.push(path("/auth"))}>
            {t("adminParkRisksSignIn")}
          </Button>
        }
      >
        <section className="admin-gate-panel text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-paw-pill bg-paw-primary-soft text-paw-on-primary-soft">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-paw-ink">
              {t("adminParkRisksNoActiveSession")}
            </p>
            <p className="mt-2 text-sm leading-6 text-paw-body">
              {t("adminParkRisksReturnAfterSignIn")}
            </p>
          </div>
        </section>
        </PageShell>
      </>
    );
  }

  if (!canViewQueue) {
    return (
      <>
        {loader}
        <PageShell
        className="admin-page-shell admin-gate-shell min-h-screen pt-28"
        eyebrow={t("adminParkRisksEyebrow")}
        title={t("adminParkRisksAccessRestricted")}
        description={t("adminParkRisksAccessRestrictedDescription")}
        actions={
          <Button type="button" variant="secondary" onClick={() => router.push(path("/"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("adminParkRisksHome")}
          </Button>
        }
      >
        <section className="admin-gate-panel text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-paw-pill bg-paw-primary-soft text-paw-on-primary-soft">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-paw-ink">
              {t("adminParkRisksNotAdmin")}
            </p>
            <p className="mt-2 text-sm leading-6 text-paw-body">
              {user?.email || t("adminParkRisksNotAuthorized")}
            </p>
          </div>
        </section>
        </PageShell>
      </>
    );
  }

  return (
    <>
      {loader}
      <PageShell
      className="admin-page-shell min-h-screen pt-28"
      eyebrow={t("adminParkRisksEyebrow")}
      title={t("adminParkRisksQueueTitle")}
      description={t("adminParkRisksQueueDescription")}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={() => router.push(path("/"))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("adminParkRisksHome")}
          </Button>
          <Button type="button" variant="trust" onClick={refreshReports} disabled={loadingReports}>
            <RefreshCw className={loadingReports ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            {t("adminParkRisksRefresh")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <QueueMetric label={t("adminParkRisksQueueMetric")} value={counts.queue} tone="warning" />
            <QueueMetric label={t("adminParkRisksReadyMetric")} value={counts.ready_for_review} tone="danger" />
            <QueueMetric label={t("adminParkRisksWaitingMetric")} value={counts.pending_confirmation} tone="trust" />
            <QueueMetric label={t("adminParkRisksHighlightedMetric")} value={counts.approved} tone="success" />
            <QueueMetric label={t("adminParkRisksRejectedMetric")} value={counts.rejected} tone="neutral" />
          </div>

          {message && (
            <StatusMessage tone={message.tone}>
              {message.text}
            </StatusMessage>
          )}

          {queueFallbackReason && (
            <div className="rounded-paw-md border border-paw-warning/20 bg-paw-warning-soft px-4 py-3 text-sm font-bold leading-6 text-paw-on-warning-soft">
              {t("adminParkRisksFallbackPrefix")} {queueFallbackReason}
            </div>
          )}

          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                  <h2 className="text-xl font-extrabold text-paw-ink">{t("adminParkRisksReports")}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterButton active={statusFilter === "queue"} onClick={() => setStatusFilter("queue")}>
                    {t("adminParkRisksQueueMetric")}
                  </FilterButton>
                  <FilterButton active={statusFilter === "ready_for_review"} onClick={() => setStatusFilter("ready_for_review")}>
                    {t("adminParkRisksReadyMetric")}
                  </FilterButton>
                  <FilterButton active={statusFilter === "pending_confirmation"} onClick={() => setStatusFilter("pending_confirmation")}>
                    {t("adminParkRisksWaitingMetric")}
                  </FilterButton>
                  <FilterButton active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")}>
                    {t("adminParkRisksHighlightedMetric")}
                  </FilterButton>
                  <FilterButton active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")}>
                    {t("adminParkRisksRejectedMetric")}
                  </FilterButton>
                </div>
              </div>

              {loadingReports ? (
                <div className="flex min-h-72 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-paw-primary" aria-hidden="true" />
                </div>
              ) : filteredReports.length === 0 ? (
                <EmptyState
                  icon={FileCheck2}
                  title={t("adminParkRisksEmptyTitle")}
                  description={t("adminParkRisksEmptyDescription")}
                />
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <RiskReportCard
                      key={report.id}
                      report={report}
                      note={notes[report.id] ?? ""}
                      busy={busyId === report.id}
                      readOnly={queueReadOnly}
                      locale={locale}
                      t={t}
                      onNoteChange={(value) =>
                        setNotes((current) => ({ ...current, [report.id]: value }))
                      }
                      onApprove={() => handleReview(report, "approved")}
                      onReject={() => handleReview(report, "rejected")}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleCreateOfficialRisk} className="space-y-5">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-paw-trust" aria-hidden="true" />
                <h2 className="text-xl font-extrabold text-paw-ink">{t("adminParkRisksOfficialSource")}</h2>
              </div>
              <p className="text-sm leading-6 text-paw-body">
                {t("adminParkRisksOfficialSourceDescription")}
              </p>

              <Input
                label={t("adminParkRisksGooglePlaceId")}
                value={officialForm.placeId}
                onChange={(event) => updateOfficialForm("placeId", event.target.value)}
                placeholder={t("adminParkRisksGooglePlaceIdPlaceholder")}
                required
              />
              <Input
                label={t("adminParkRisksPlaceName")}
                value={officialForm.placeName}
                onChange={(event) => updateOfficialForm("placeName", event.target.value)}
                placeholder={t("adminParkRisksPlaceNamePlaceholder")}
                required
              />
              <Input
                label={t("adminParkRisksAddress")}
                value={officialForm.placeAddress}
                onChange={(event) => updateOfficialForm("placeAddress", event.target.value)}
                placeholder={t("adminParkRisksAddressPlaceholder")}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">{t("adminParkRisksRiskType")}</span>
                  <select
                    value={officialForm.riskType}
                    onChange={(event) => updateOfficialForm("riskType", event.target.value as RiskType)}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    {riskTypeOptions.map(([value, labelKey]) => (
                      <option key={value} value={value}>{t(labelKey)}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">{t("adminParkRisksSeverity")}</span>
                  <select
                    value={officialForm.severity}
                    onChange={(event) => updateOfficialForm("severity", event.target.value as Severity)}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    {severityOptions.map(([value, labelKey]) => (
                      <option key={value} value={value}>{t(labelKey)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <Input
                label={t("adminParkRisksTitleLabel")}
                value={officialForm.title}
                onChange={(event) => updateOfficialForm("title", event.target.value)}
                placeholder={t("adminParkRisksTitlePlaceholder")}
                required
              />
              <label className="block space-y-1.5">
                <span className="block text-sm font-bold text-paw-ink">{t("adminParkRisksDescriptionLabel")}</span>
                <textarea
                  value={officialForm.description}
                  onChange={(event) => updateOfficialForm("description", event.target.value)}
                  rows={5}
                  className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 py-3 text-sm text-paw-ink shadow-sm transition placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  placeholder={t("adminParkRisksDescriptionPlaceholder")}
                  required
                />
              </label>
              <Input
                label={t("adminParkRisksOfficialSourceName")}
                value={officialForm.sourceName}
                onChange={(event) => updateOfficialForm("sourceName", event.target.value)}
                placeholder={t("adminParkRisksOfficialSourceNamePlaceholder")}
                required
              />
              <Input
                label={t("adminParkRisksOfficialSourceUrl")}
                type="url"
                value={officialForm.sourceUrl}
                onChange={(event) => updateOfficialForm("sourceUrl", event.target.value)}
                placeholder="https://stad.gent/..."
                required
              />
              <Input
                label={t("adminParkRisksEvidenceUrl")}
                type="url"
                value={officialForm.evidenceUrl}
                onChange={(event) => updateOfficialForm("evidenceUrl", event.target.value)}
                placeholder={t("adminParkRisksEvidenceUrlPlaceholder")}
              />

              <Button
                type="submit"
                size="lg"
                disabled={creatingOfficial || queueReadOnly}
                className="w-full"
              >
                {creatingOfficial ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                )}
                {queueReadOnly
                  ? t("adminParkRisksPreviewOnly")
                  : t("adminParkRisksHighlightOfficialRisk")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </PageShell>
    </>
  );
}

function QueueMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "trust" | "warning" | "danger" | "success" | "neutral";
}) {
  return (
    <Card>
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

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-paw-sm border px-3 py-1.5 text-xs font-extrabold transition ${
        active
          ? "border-paw-primary/30 bg-paw-primary-soft text-paw-on-primary-soft"
          : "border-paw-border bg-paw-panel-subtle text-paw-body hover:border-paw-primary/30"
      }`}
    >
      {children}
    </button>
  );
}

function RiskReportCard({
  report,
  note,
  busy,
  readOnly,
  locale,
  t,
  onNoteChange,
  onApprove,
  onReject,
}: {
  report: ParkRiskReport;
  note: string;
  busy: boolean;
  readOnly: boolean;
  locale: Locale;
  t: ParkRiskTranslation;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canReview =
    !readOnly &&
    (report.status === "ready_for_review" ||
      report.status === "pending_confirmation");

  return (
    <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(report.status)}>{t(statusLabelKeys[report.status])}</Badge>
            <Badge tone={severityTone(report.severity)}>{t(severityLabelKeys[report.severity])}</Badge>
            <Badge tone={report.source_type === "official" ? "success" : "trust"}>
              {report.source_type === "official"
                ? t("adminParkRisksOfficial")
                : t("adminParkRisksCommunity")}
            </Badge>
            <span className="text-xs font-bold text-paw-muted">
              {report.confirmation_count}/3 {t("adminParkRisksConfirmations")}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-paw-ink">{report.title}</h3>
          <p className="text-sm font-bold text-paw-primary">
            {t(riskTypeLabelKeys[report.risk_type])}
          </p>
        </div>
        <div className="text-left text-xs font-semibold text-paw-muted md:text-right">
          <p>{t("adminParkRisksUpdated")} {formatDate(report.updated_at, locale, t)}</p>
          <p>{t("adminParkRisksReviewed")} {formatDate(report.reviewed_at, locale, t)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-paw-body">{report.description}</p>
          {report.review_note && (
            <div className="rounded-paw-sm border border-paw-border bg-paw-panel px-3 py-2 text-sm font-semibold text-paw-body">
              {t("adminParkRisksReviewNoteColon")} {report.review_note}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {report.evidence_url && (
              <a
                href={report.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-paw-trust hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {t("adminParkRisksEvidence")}
              </a>
            )}
            {report.official_source_url && (
              <a
                href={report.official_source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-paw-success hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {report.official_source_name || t("adminParkRisksOfficialSource")}
              </a>
            )}
          </div>
        </div>

        <div className="rounded-paw-sm border border-paw-border bg-paw-panel p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-none text-paw-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-paw-ink">
                {report.place_name}
              </p>
              {report.place_address && (
                <p className="mt-1 text-xs leading-5 text-paw-muted">
                  {report.place_address}
                </p>
              )}
              <p className="mt-2 break-all text-xs font-semibold text-paw-muted">
                {report.place_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {canReview && (
        <div className="mt-4 space-y-3 border-t border-paw-border pt-4">
          <label className="block space-y-1.5">
            <span className="block text-sm font-bold text-paw-ink">{t("adminParkRisksReviewNote")}</span>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={2}
              className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 py-2 text-sm text-paw-ink shadow-sm transition placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
              placeholder={t("adminParkRisksReviewNotePlaceholder")}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="trust" onClick={onApprove} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {t("adminParkRisksApprove")}
            </Button>
            <Button type="button" variant="danger" onClick={onReject} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {t("adminParkRisksReject")}
            </Button>
          </div>
        </div>
      )}
      {readOnly &&
        (report.status === "ready_for_review" ||
          report.status === "pending_confirmation") && (
          <div className="mt-4 rounded-paw-sm border border-paw-warning/20 bg-paw-warning-soft px-3 py-2 text-sm font-bold text-paw-on-warning-soft">
            {t("adminParkRisksReviewActionsReadOnly")}
          </div>
        )}
    </div>
  );
}
