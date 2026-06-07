"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/components/AuthProvider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  PageShell,
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

const riskTypeLabels: Record<RiskType, string> = {
  toxic_plants: "Toxic plants",
  wildlife: "Wildlife",
  water_terrain: "Water or terrain",
  construction_closure: "Construction or closure",
  sanitation_pollution: "Sanitation or pollution",
  other: "Other",
};

const severityLabels: Record<Severity, string> = {
  info: "Info",
  caution: "Caution",
  high: "High",
};

const statusLabels: Record<RiskStatus, string> = {
  pending_confirmation: "Awaiting confirmations",
  ready_for_review: "Ready for review",
  approved: "Highlighted",
  rejected: "Rejected",
  archived: "Archived",
};

const riskTypeOptions = Object.entries(riskTypeLabels) as [RiskType, string][];
const severityOptions = Object.entries(severityLabels) as [Severity, string][];

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

async function checkPawPalAdmin() {
  const { data, error } = await supabase.rpc("is_pawpal_admin");
  if (error) return false;
  return Boolean(data);
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

function formatDate(value: string | null) {
  if (!value) return "Not reviewed";
  return new Intl.DateTimeFormat("en", {
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
  const { user, loading: authLoading } = useAuth();
  const [adminCheck, setAdminCheck] = useState<{
    email: string | null;
    allowed: boolean;
    checking: boolean;
  }>({ email: null, allowed: false, checking: false });
  const [reports, setReports] = useState<ParkRiskReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
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

  const refreshReports = useCallback(async () => {
    setLoadingReports(true);
    const { data, error } = await supabase
      .from("park_risk_reports")
      .select(RISK_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage({
        tone: "warning",
        text: `Risk queue is not ready yet: ${error.message}`,
      });
      setReports([]);
    } else {
      setReports((data ?? []) as unknown as ParkRiskReport[]);
    }
    setLoadingReports(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!currentAdminEmail) return;
    const timer = window.setTimeout(() => {
      setAdminCheck({
        email: currentAdminEmail,
        allowed: false,
        checking: true,
      });
      checkPawPalAdmin().then((allowed) => {
        if (cancelled) return;
        setAdminCheck({
          email: currentAdminEmail,
          allowed,
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
    if (!isAdmin) return;
    const timer = window.setTimeout(() => {
      void refreshReports();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isAdmin, refreshReports]);

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
            ? "Risk approved and highlighted."
            : "Risk rejected.",
      });
      setNotes((current) => ({ ...current, [report.id]: "" }));
      await refreshReports();
    }
    setBusyId(null);
  }

  async function handleCreateOfficialRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        text: "Place, title, description, source name, and source URL are required.",
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
      review_note: "Official source verified by PawPal admin.",
    });

    if (error) {
      setMessage({
        tone: "danger",
        text: error.message,
      });
    } else {
      setMessage({
        tone: "success",
        text: "Official risk added and highlighted.",
      });
      setOfficialForm(initialOfficialForm);
      await refreshReports();
    }
    setCreatingOfficial(false);
  }

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paw-page pt-24 text-paw-ink">
        <Loader2 className="h-8 w-8 animate-spin text-paw-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell
        className="min-h-screen pt-28"
        eyebrow="Park risk admin"
        title="Sign in required"
        description="Use an approved PawPal admin account to review park risk reports."
        actions={
          <Button type="button" onClick={() => router.push("/auth")}>
            Sign in
          </Button>
        }
      >
        <Card className="p-8">
          <EmptyState
            icon={ShieldCheck}
            title="No active session"
            description="After signing in, return to /admin/park-risks."
          />
        </Card>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        className="min-h-screen pt-28"
        eyebrow="Park risk admin"
        title="Review access is restricted"
        description="This account is not listed in pawpal_admins. Add the email in Supabase before reviewing reports."
        actions={
          <Button type="button" variant="secondary" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Button>
        }
      >
        <Card className="p-8">
          <EmptyState
            icon={ShieldCheck}
            title="Not a PawPal admin"
            description={user.email || "Current user is not authorized."}
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      className="min-h-screen pt-28"
      eyebrow="Park risk admin"
      title="Risk review queue"
      description="Review community-confirmed park risks and add verified official-source risks for highlighting in PawPal place pages."
      actions={
        <>
          <Button type="button" variant="secondary" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Button>
          <Button type="button" variant="trust" onClick={refreshReports} disabled={loadingReports}>
            <RefreshCw className={loadingReports ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Refresh
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <QueueMetric label="Queue" value={counts.queue} tone="warning" />
            <QueueMetric label="Ready" value={counts.ready_for_review} tone="danger" />
            <QueueMetric label="Waiting" value={counts.pending_confirmation} tone="trust" />
            <QueueMetric label="Highlighted" value={counts.approved} tone="success" />
            <QueueMetric label="Rejected" value={counts.rejected} tone="neutral" />
          </div>

          {message && (
            <div className={`rounded-paw-md border px-4 py-3 text-sm font-bold ${
              message.tone === "success"
                ? "border-paw-success/20 bg-paw-success-soft text-paw-success"
                : message.tone === "warning"
                  ? "border-paw-warning/20 bg-paw-warning-soft text-paw-warning"
                  : "border-paw-danger/20 bg-paw-danger-soft text-paw-danger"
            }`}>
              {message.text}
            </div>
          )}

          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-paw-primary" aria-hidden="true" />
                  <h2 className="text-xl font-extrabold text-paw-ink">Reports</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterButton active={statusFilter === "queue"} onClick={() => setStatusFilter("queue")}>
                    Queue
                  </FilterButton>
                  <FilterButton active={statusFilter === "ready_for_review"} onClick={() => setStatusFilter("ready_for_review")}>
                    Ready
                  </FilterButton>
                  <FilterButton active={statusFilter === "pending_confirmation"} onClick={() => setStatusFilter("pending_confirmation")}>
                    Waiting
                  </FilterButton>
                  <FilterButton active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")}>
                    Highlighted
                  </FilterButton>
                  <FilterButton active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")}>
                    Rejected
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
                  title="No reports in this view"
                  description="Community reports appear here after submission or confirmation."
                />
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <RiskReportCard
                      key={report.id}
                      report={report}
                      note={notes[report.id] ?? ""}
                      busy={busyId === report.id}
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
                <h2 className="text-xl font-extrabold text-paw-ink">Official source</h2>
              </div>
              <p className="text-sm leading-6 text-paw-body">
                Add verified official-source information. These entries are highlighted immediately.
              </p>

              <Input
                label="Google Place ID"
                value={officialForm.placeId}
                onChange={(event) => updateOfficialForm("placeId", event.target.value)}
                placeholder="places/ChIJ... or ChIJ..."
                required
              />
              <Input
                label="Place name"
                value={officialForm.placeName}
                onChange={(event) => updateOfficialForm("placeName", event.target.value)}
                placeholder="Citadelpark"
                required
              />
              <Input
                label="Address"
                value={officialForm.placeAddress}
                onChange={(event) => updateOfficialForm("placeAddress", event.target.value)}
                placeholder="Citadelpark, 9000 Gent"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">Risk type</span>
                  <select
                    value={officialForm.riskType}
                    onChange={(event) => updateOfficialForm("riskType", event.target.value as RiskType)}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    {riskTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-bold text-paw-ink">Severity</span>
                  <select
                    value={officialForm.severity}
                    onChange={(event) => updateOfficialForm("severity", event.target.value as Severity)}
                    className="h-11 w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 text-sm font-bold text-paw-ink shadow-sm focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  >
                    {severityOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <Input
                label="Title"
                value={officialForm.title}
                onChange={(event) => updateOfficialForm("title", event.target.value)}
                placeholder="Temporary leash restriction"
                required
              />
              <label className="block space-y-1.5">
                <span className="block text-sm font-bold text-paw-ink">Description</span>
                <textarea
                  value={officialForm.description}
                  onChange={(event) => updateOfficialForm("description", event.target.value)}
                  rows={5}
                  className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 py-3 text-sm text-paw-ink shadow-sm transition placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
                  placeholder="Summarize the official notice in pet-owner language."
                  required
                />
              </label>
              <Input
                label="Official source name"
                value={officialForm.sourceName}
                onChange={(event) => updateOfficialForm("sourceName", event.target.value)}
                placeholder="City of Ghent"
                required
              />
              <Input
                label="Official source URL"
                type="url"
                value={officialForm.sourceUrl}
                onChange={(event) => updateOfficialForm("sourceUrl", event.target.value)}
                placeholder="https://stad.gent/..."
                required
              />
              <Input
                label="Evidence URL"
                type="url"
                value={officialForm.evidenceUrl}
                onChange={(event) => updateOfficialForm("evidenceUrl", event.target.value)}
                placeholder="Optional supporting link"
              />

              <Button type="submit" size="lg" disabled={creatingOfficial} className="w-full">
                {creatingOfficial ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                )}
                Highlight official risk
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
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
          ? "border-paw-primary/30 bg-paw-primary-soft text-paw-primary"
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
  onNoteChange,
  onApprove,
  onReject,
}: {
  report: ParkRiskReport;
  note: string;
  busy: boolean;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canReview =
    report.status === "ready_for_review" ||
    report.status === "pending_confirmation";

  return (
    <div className="rounded-paw-md border border-paw-border bg-paw-panel-subtle p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(report.status)}>{statusLabels[report.status]}</Badge>
            <Badge tone={severityTone(report.severity)}>{severityLabels[report.severity]}</Badge>
            <Badge tone={report.source_type === "official" ? "success" : "trust"}>
              {report.source_type === "official" ? "Official" : "Community"}
            </Badge>
            <span className="text-xs font-bold text-paw-muted">
              {report.confirmation_count}/3 confirmations
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-paw-ink">{report.title}</h3>
          <p className="text-sm font-bold text-paw-primary">
            {riskTypeLabels[report.risk_type]}
          </p>
        </div>
        <div className="text-left text-xs font-semibold text-paw-muted md:text-right">
          <p>Updated {formatDate(report.updated_at)}</p>
          <p>Reviewed {formatDate(report.reviewed_at)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <p className="text-sm leading-6 text-paw-body">{report.description}</p>
          {report.review_note && (
            <div className="rounded-paw-sm border border-paw-border bg-paw-panel px-3 py-2 text-sm font-semibold text-paw-body">
              Review note: {report.review_note}
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
                Evidence
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
                {report.official_source_name || "Official source"}
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
            <span className="block text-sm font-bold text-paw-ink">Review note</span>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={2}
              className="w-full rounded-paw-md border border-paw-border bg-paw-panel px-3 py-2 text-sm text-paw-ink shadow-sm transition placeholder:text-paw-muted focus-visible:border-paw-trust focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20"
              placeholder="Optional internal note shown with this review."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="trust" onClick={onApprove} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              Approve
            </Button>
            <Button type="button" variant="danger" onClick={onReject} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
