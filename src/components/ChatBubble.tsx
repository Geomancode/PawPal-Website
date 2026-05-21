"use client";

import { MapPin, Sparkles, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "tool_call" | "tool_result";
  content: string;
  toolName?: string;
  toolData?: Record<string, unknown>;
  timestamp: number;
}

interface ChatBubbleProps {
  message: ChatMessageData;
  onLocate?: (lat: number, lng: number) => void;
}

// ── Place / Quest emoji maps (same as GlobeFullPage) ─────────────────────────

const PLACE_EMOJI: Record<string, string> = {
  vet: "🏥", groomer: "✂️", pet_shop: "🛒", park: "🌳",
  dog_park: "🐾", cafe: "☕", shelter: "🏠", kennel: "🐶",
  training: "🎓", stable: "🐴", aquarium_shop: "🐠", exotic_vet: "🦎",
  zoo: "🦁", wildlife_centre: "🦅", other: "📍",
};

const QUEST_EMOJI: Record<string, string> = {
  walk: "🐕", care: "💛", knowledge: "📖", share: "📣",
  skill: "🛠️", transport: "🚗", foster: "🏠", vet_accompany: "🏥",
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function ChatBubble({ message, onLocate }: ChatBubbleProps) {
  switch (message.role) {
    case "user":
      return <UserBubble text={message.content} />;
    case "assistant":
      return <AssistantBubble text={message.content} />;
    case "tool_call":
      return <ToolBadge label={message.content} />;
    case "tool_result":
      return (
        <ToolResultCard
          toolName={message.toolName || ""}
          data={message.toolData || {}}
          onLocate={onLocate}
        />
      );
    default:
      return null;
  }
}

// ── User Bubble ──────────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-paw-primary text-sm text-white leading-relaxed shadow-paw-action"
      >
        {text}
      </div>
    </div>
  );
}

// ── Assistant Text Bubble ────────────────────────────────────────────────────

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex gap-2 max-w-[85%]">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-paw-trust to-paw-primary flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-paw-panel/90 border border-paw-border shadow-sm text-sm text-paw-body leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
}

// ── Tool Badge (thinking indicator) ──────────────────────────────────────────

function ToolBadge({ label }: { label: string }) {
  return (
    <div className="flex justify-start mb-2 pl-8">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paw-trust-soft border border-paw-trust/15 text-xs text-paw-trust font-medium">
        <div className="w-2 h-2 rounded-full bg-paw-trust animate-pulse" />
        {label}
      </div>
    </div>
  );
}

// ── Tool Result Cards ────────────────────────────────────────────────────────

interface ToolResultProps {
  toolName: string;
  data: Record<string, unknown>;
  onLocate?: (lat: number, lng: number) => void;
}

function ToolResultCard({ toolName, data, onLocate }: ToolResultProps) {
  switch (toolName) {
    case "search_places":
      return <PlaceResults data={data} onLocate={onLocate} />;
    case "search_missions":
      return <MissionResults data={data} onLocate={onLocate} />;
    case "check_food_safety":
      return <FoodSafetyCard data={data} />;
    case "breed_encyclopedia":
      return <BreedCard data={data} />;
    default:
      return null;
  }
}

// ── Place Results ────────────────────────────────────────────────────────────

interface PlaceItem {
  id: string;
  name: string;
  place_type: string;
  lat: number;
  lng: number;
  city?: string;
  rating_avg?: number;
}

function PlaceResults({
  data,
  onLocate,
}: {
  data: Record<string, unknown>;
  onLocate?: (lat: number, lng: number) => void;
}) {
  const places = (data.places as PlaceItem[]) || [];
  if (places.length === 0) return null;

  return (
    <div className="flex justify-start mb-3 pl-8">
      <div className="w-full max-w-[85%] space-y-1.5">
        {places.map((p) => {
          const emoji = PLACE_EMOJI[p.place_type] || "📍";
          const rating =
            p.rating_avg != null ? `⭐ ${Number(p.rating_avg).toFixed(1)}` : "";

          return (
            <button
              key={p.id}
              onClick={() => p.lat && p.lng && onLocate?.(p.lat, p.lng)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-paw-md bg-paw-panel/90 border border-paw-border shadow-sm hover:border-paw-trust/35 hover:shadow-paw-panel transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-paw-sm bg-paw-trust-soft flex items-center justify-center text-base shrink-0">
                {emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-paw-ink truncate">
                  {p.name}
                </p>
                <p className="text-xs text-paw-muted truncate">
                  {p.place_type?.replace(/_/g, " ")}
                  {p.city ? ` · ${p.city}` : ""}
                  {rating ? ` · ${rating}` : ""}
                </p>
              </div>
              {p.lat && p.lng && (
                <MapPin className="w-4 h-4 text-paw-muted group-hover:text-paw-trust shrink-0 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Mission Results ──────────────────────────────────────────────────────────

interface MissionItem {
  id: string;
  title: string;
  quest_type: string;
  status: string;
  reward_type?: string;
  lat?: number;
  lng?: number;
}

function MissionResults({
  data,
  onLocate,
}: {
  data: Record<string, unknown>;
  onLocate?: (lat: number, lng: number) => void;
}) {
  const missions = (data.missions as MissionItem[]) || [];
  if (missions.length === 0) return null;

  return (
    <div className="flex justify-start mb-3 pl-8">
      <div className="w-full max-w-[85%] space-y-1.5">
        {missions.map((m) => {
          const emoji = QUEST_EMOJI[m.quest_type] || "🐾";
          return (
            <button
              key={m.id}
              onClick={() => m.lat && m.lng && onLocate?.(m.lat, m.lng)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-paw-md bg-paw-panel/90 border border-paw-border shadow-sm hover:border-paw-accent/35 hover:shadow-paw-panel transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-paw-sm bg-paw-accent-soft flex items-center justify-center text-base shrink-0">
                {emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-paw-ink truncate">
                  {m.title || "Mission"}
                </p>
                <p className="text-xs text-paw-muted truncate">
                  {m.quest_type} · {m.status}
                  {m.reward_type ? ` · 🎁 ${m.reward_type}` : ""}
                </p>
              </div>
              {m.lat && m.lng && (
                <MapPin className="w-4 h-4 text-paw-muted group-hover:text-paw-accent shrink-0 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Food Safety Card ─────────────────────────────────────────────────────────

function FoodSafetyCard({ data }: { data: Record<string, unknown> }) {
  const results = (data.results as Record<string, unknown>[]) || [];
  const found = data.found as boolean;
  const itemSearched = data.item_searched as string;

  if (!found || results.length === 0) {
    return (
      <div className="flex justify-start mb-3 pl-8">
        <div className="px-4 py-3 rounded-paw-md bg-paw-panel-subtle border border-paw-border text-sm text-paw-muted">
          No toxicity data found for &quot;{itemSearched}&quot;. When in doubt, consult
          your vet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3 pl-8">
      <div className="w-full max-w-[85%] space-y-1.5">
        {results.map((r, i) => {
          const toxicity = (r.toxicity_level as string) || "unknown";
          const isDangerous =
            toxicity === "toxic" ||
            toxicity === "highly_toxic" ||
            toxicity === "lethal";

          return (
            <div
              key={i}
              className={`px-4 py-3 rounded-xl border text-sm ${
                isDangerous
                  ? "bg-paw-danger-soft border-paw-danger/25"
                  : "bg-paw-success-soft border-paw-success/25"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isDangerous ? (
                  <AlertTriangle className="w-4 h-4 text-paw-danger" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-paw-success" />
                )}
                <span
                  className={`font-semibold ${
                    isDangerous ? "text-paw-danger" : "text-paw-success"
                  }`}
                >
                  {(r.item_name as string) || itemSearched} — {toxicity.replace(/_/g, " ")}
                </span>
              </div>
              {typeof r.description === "string" && r.description && (
                <p
                  className={`text-xs leading-relaxed ${
                    isDangerous ? "text-paw-danger" : "text-paw-success"
                  }`}
                >
                  {r.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Breed Encyclopedia Card ──────────────────────────────────────────────────

function BreedCard({ data }: { data: Record<string, unknown> }) {
  const breeds = (data.breeds as Record<string, unknown>[]) || [];
  if (breeds.length === 0) return null;

  return (
    <div className="flex justify-start mb-3 pl-8">
      <div className="w-full max-w-[85%] space-y-1.5">
        {breeds.map((b, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded-paw-md bg-paw-trust-soft border border-paw-trust/20 text-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-paw-trust" />
              <span className="font-semibold text-paw-ink">
                {String(b.breed_name ?? "")}
              </span>
              {typeof b.species_group === "string" && b.species_group && (
                <span className="px-2 py-0.5 rounded-full bg-paw-panel text-paw-trust text-[10px] font-bold uppercase">
                  {b.species_group}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-paw-body">
              {typeof b.origin === "string" && b.origin && (
                <p>
                  🌍 <span className="text-paw-trust">Origin:</span>{" "}
                  {b.origin}
                </p>
              )}
              {b.care_difficulty != null && (
                <p>
                  🩺 <span className="text-paw-trust">Care:</span>{" "}
                  {String(b.care_difficulty)}/5
                </p>
              )}
              {typeof b.lifespan === "string" && b.lifespan && (
                <p>
                  ⏱️ <span className="text-paw-trust">Lifespan:</span>{" "}
                  {b.lifespan}
                </p>
              )}
              {typeof b.legal_status_be === "string" && b.legal_status_be && (
                <p>
                  🇧🇪 <span className="text-paw-trust">Belgium:</span>{" "}
                  {b.legal_status_be}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
