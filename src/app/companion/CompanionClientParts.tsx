"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import Button, { buttonClassName } from "@/components/ui/Button";
import { useRouteTranslations } from "@/i18n/useRouteTranslations";
import { localeFromPath, localizedPath } from "@/i18n/routing";
import type { MessageKey } from "@/i18n/messages/en";
import {
  CompanionClient, CompanionError,
  type CompanionEmotion, type CompanionHistory, type CompanionMemory,
  type CompanionPet, type CompanionReply, type CompanionSettings, type MemoryPage,
} from "@/lib/companion";

const panel = "rounded-paw-panel border border-paw-border bg-paw-panel p-5 sm:p-6";
const field = "w-full min-h-paw-min-tap rounded-paw-sm border border-paw-border-strong bg-paw-panel px-3 py-3 text-paw-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paw-trust/20 disabled:opacity-50";
const emotionLabels: Record<CompanionEmotion, MessageKey> = { happy: "companionHappy", calm: "companionCalm", curious: "companionCurious", comforting: "companionComforting" };
type Translate = (key: MessageKey) => string;
type State = { settings: CompanionSettings; history: CompanionHistory; memories: MemoryPage };

function errorKey(error: unknown): MessageKey {
  if (!(error instanceof CompanionError)) return "companionUnavailable";
  if (error.code === "unauthenticated") return "companionAuthExpired";
  if (error.code === "version_conflict" || error.code === "stale_turn") return "companionChanged";
  if (error.code === "rate_limited") return "companionRateLimited";
  if (error.code === "generation_in_progress") return "companionInProgress";
  if (error.code === "learning_disabled") return "companionLearningDisabled";
  if (error.code === "source_limit_reached") return "companionMemoryLimit";
  if (error.code === "idempotency_conflict" || error.code === "resource_unavailable" || error.code === "invalid_request") return "companionRefreshNeeded";
  return "companionUnavailable";
}

export default function CompanionClientParts() {
  const { user, loading } = useAuth();
  const { t, loader } = useRouteTranslations();
  const locale = localeFromPath(usePathname());
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-6">
      {loader}
      <header className="mb-8 max-w-2xl">
        <p className="mb-3 text-paw-type-caption font-bold uppercase tracking-widest text-paw-primary">PawPal</p>
        <h1 className="text-paw-type-h1 font-black tracking-tight text-paw-ink">{t("companionTitle")}</h1>
        <p className="mt-3 text-paw-type-body leading-relaxed text-paw-body">{t("companionIntro")}</p>
      </header>
      {loading ? <p role="status" className={panel}>{t("companionLoading")}</p> : !user ? (
        <section className={panel}>
          <h2 className="text-paw-type-h3 font-bold">{t("companionSignInTitle")}</h2>
          <p className="my-4 text-paw-body">{t("companionSignInBody")}</p>
          <Link className={buttonClassName()} href={localizedPath("/auth", locale)}>{t("navLogin")}</Link>
        </section>
      ) : <OwnedPets key={user.id} ownerId={user.id} t={t} profilePath={localizedPath("/profile", locale)} locale={locale} />}
    </div>
  );
}

function OwnedPets({ ownerId, t, profilePath, locale }: { ownerId: string; t: Translate; profilePath: string; locale: string }) {
  const api = useMemo(() => new CompanionClient(ownerId), [ownerId]);
  const [pets, setPets] = useState<CompanionPet[] | null>(null);
  const [petId, setPetId] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void api.pets().then((items) => {
      if (!active) return;
      let previous: string | null = null;
      try { previous = localStorage.getItem(`companion.pet.v1.${ownerId}`); } catch { /* Selection persistence is optional in private browsing. */ }
      setPetId(items.find(pet => pet.id === previous)?.id ?? items[0]?.id ?? "");
      setPets(items); setError(null);
    }).catch((reason: unknown) => { if (active) setError(errorKey(reason)); });
    return () => { active = false; };
  }, [api, ownerId, attempt]);
  if (error) return <div className={panel}><p role="alert" className="mb-4">{t(error)}</p><Button onClick={() => { setError(null); setAttempt(value => value + 1); }}>{t("companionRetry")}</Button></div>;
  if (!pets) return <p role="status" className={panel}>{t("companionLoading")}</p>;
  if (!pets.length) return <section className={panel}><h2 className="text-paw-type-h3 font-bold">{t("companionNoPets")}</h2><p className="my-4 text-paw-body">{t("companionNoPetsBody")}</p><Link className={buttonClassName()} href={profilePath}>{t("companionManagePets")}</Link></section>;
  const pet = pets.find(item => item.id === petId);
  return <>
    <div className="mb-6 max-w-sm">
      <label htmlFor="companion-pet" className="mb-2 block font-bold">{t("companionChoosePet")}</label>
      <select id="companion-pet" className={field} value={petId} onChange={event => {
        setPetId(event.target.value);
        try { localStorage.setItem(`companion.pet.v1.${ownerId}`, event.target.value); } catch { /* The selected pet still works without local storage. */ }
      }}>{pets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </div>
    {pet ? <PetCompanion key={pet.id} pet={pet} api={api} t={t} locale={locale} /> : null}
  </>;
}

function PetCompanion({ pet, api, t, locale }: { pet: CompanionPet; api: CompanionClient; t: Translate; locale: string }) {
  const petFace = /^(dog|canine)$/i.test(pet.species_group ?? "") ? "🐶" : /^(cat|feline)$/i.test(pet.species_group ?? "") ? "🐱" : "🐾";
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [remember, setRemember] = useState(false);
  const [emotion, setEmotion] = useState<CompanionEmotion>("calm");
  const [reply, setReply] = useState<CompanionReply | null>(null);
  const [notice, setNotice] = useState<MessageKey | null>(null);
  const [editing, setEditing] = useState<CompanionMemory | null>(null);
  const [replacement, setReplacement] = useState("");
  const active = useRef(false);
  const operation = useRef(0);
  const lock = useRef(false);
  const pending = useRef<Parameters<CompanionClient["send"]>[0] | null>(null);
  const latestMessage = useRef<HTMLDivElement>(null);

  const readState = useCallback(async (sessionId?: string): Promise<State> => {
    const sessionPromise = sessionId ? Promise.resolve({ session_id: sessionId }) : api.latestSession(pet.id);
    const [settings, session, memories] = await Promise.all([api.settings(pet.id), sessionPromise, api.memories(pet.id)]);
    const history = await api.history(pet.id, session.session_id);
    const current = await api.settings(pet.id);
    // Do not combine old memories with a new consent version during cross-device changes.
    if (settings.consent_epoch !== current.consent_epoch || settings.invalidation_revision !== current.invalidation_revision || history.consent_epoch !== current.consent_epoch || history.invalidation_revision !== current.invalidation_revision || memories.invalidation_revision !== current.invalidation_revision || memories.memory_revision !== current.memory_revision) {
      throw new CompanionError("version_conflict");
    }
    return { settings: current, history, memories };
  }, [api, pet.id]);

  const refresh = useCallback(async () => {
    const token = ++operation.current;
    try {
      const result = await readState();
      if (active.current && token === operation.current) { setState(result); setError(null); }
    } catch (reason) { if (active.current && token === operation.current) setError(errorKey(reason)); }
  }, [readState]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; };
  }, [refresh]);
  useEffect(() => { latestMessage.current?.scrollIntoView({ block: "nearest" }); }, [state?.history.messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!state || lock.current || !draft.trim()) return;
    lock.current = true; setBusy(true); setError(null); setNotice(null);
    const message = draft.trim();
    const shouldRemember = state.settings.enabled && remember;
    const old = pending.current;
    const request = old && old.message === message && old.remember === shouldRemember ? old : {
      pet_id: pet.id, session_id: state.history.session_id, request_id: crypto.randomUUID(), message,
      expected_epoch: state.history.consent_epoch, expected_invalidation_revision: state.history.invalidation_revision,
      remember: shouldRemember,
    };
    pending.current = request;
    const token = ++operation.current;
    try {
      const response = await api.send(request);
      const result = await readState(request.session_id);
      if (!active.current || token !== operation.current) return;
      setState(result);
      // A memory correction on another device can complete while Qwen is replying.
      if (response.context.consent_epoch === result.history.consent_epoch && response.context.invalidation_revision === result.history.invalidation_revision) {
        setReply(response); setEmotion(response.emotion);
      } else { setReply(null); setNotice("companionHistoryReset"); }
      setDraft(""); setRemember(false); pending.current = null;
    } catch (reason) {
      if (!active.current || token !== operation.current) return;
      setError(errorKey(reason));
      if (reason instanceof CompanionError && ["version_conflict", "stale_turn", "learning_disabled"].includes(reason.code)) {
        pending.current = null; setReply(null); setState(null); setRemember(false);
        try { const result = await readState(request.session_id); if (active.current && token === operation.current) setState(result); }
        catch { /* The visible error remains and the full reload action stays available. */ }
      }
    } finally { if (active.current && token === operation.current) { lock.current = false; setBusy(false); } }
  }

  async function mutate(action: () => Promise<unknown>, sessionId = state?.history.session_id, invalidates = false) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError(null); setNotice(null);
    pending.current = null;
    const token = ++operation.current;
    if (invalidates) { setReply(null); setState(current => current ? { ...current, history: { ...current.history, messages: [] }, memories: { ...current.memories, memories: [], next_cursor: null } } : null); }
    try {
      await action();
      const result = await readState(sessionId);
      if (!active.current || token !== operation.current) return;
      setState(result); setEditing(null); setRemember(false);
      setNotice(invalidates ? "companionHistoryReset" : "companionSaved");
      return true;
    } catch (reason) {
      if (active.current && token === operation.current) {
        setError(errorKey(reason));
        if (invalidates || (reason instanceof CompanionError && ["version_conflict", "learning_disabled"].includes(reason.code))) {
          setReply(null); setState(null); setRemember(false);
        }
      }
      return false;
    } finally { if (active.current && token === operation.current) { lock.current = false; setBusy(false); } }
  }

  function feedback(memory: CompanionMemory, action: "forget" | "correct") {
    return mutate(() => api.call("memory.feedback", {
      pet_id: pet.id, memory_id: memory.id, request_id: crypto.randomUUID(), expected_version: memory.version, action,
      ...(action === "correct" ? { replacement: replacement.trim() } : {}),
    }), state?.history.session_id, true);
  }

  async function moreMemories() {
    if (!state?.memories.next_cursor || lock.current) return;
    lock.current = true; setBusy(true);
    const token = ++operation.current;
    try {
      const before = await api.settings(pet.id);
      const page = await api.memories(pet.id, state.memories.next_cursor);
      const after = await api.settings(pet.id);
      if (before.consent_epoch !== after.consent_epoch || before.invalidation_revision !== after.invalidation_revision || before.memory_revision !== after.memory_revision || after.consent_epoch !== state.history.consent_epoch || after.invalidation_revision !== state.history.invalidation_revision || page.invalidation_revision !== after.invalidation_revision || page.memory_revision !== after.memory_revision || state.memories.memory_revision !== page.memory_revision) {
        throw new CompanionError("version_conflict");
      }
      if (active.current && token === operation.current) setState(current => current ? { ...current, memories: { ...page, memories: [...current.memories.memories, ...page.memories] } } : null);
    } catch (reason) {
      if (!active.current || token !== operation.current) return;
      setReply(null); setState(null); setRemember(false); pending.current = null;
      try {
        const refreshed = await readState(state.history.session_id);
        if (active.current && token === operation.current) { setState(refreshed); setNotice("companionHistoryReset"); setError(null); }
      } catch (refreshError) { if (active.current && token === operation.current) setError(errorKey(refreshError ?? reason)); }
    } finally { if (active.current && token === operation.current) { lock.current = false; setBusy(false); } }
  }

  return <>
    {error ? <div role="alert" className="mb-5 rounded-paw-sm border border-paw-border bg-paw-primary-soft p-4"><p>{t(error)}</p>{!state ? <Button className="mt-3" disabled={busy} onClick={() => { setError(null); void refresh(); }}>{t("companionRetry")}</Button> : null}</div> : null}
    {!state ? (!error ? <p role="status" className={panel}>{t("companionLoading")}</p> : null) : <div className="grid items-start gap-6 lg:grid-cols-3">
      <section className={`${panel} min-w-0 lg:col-span-2`} aria-label={t("companionChat")}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paw-border pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paw-primary-soft text-paw-type-h1" aria-hidden="true">{petFace}</span>
            <div className="min-w-0"><h2 className="break-words text-paw-type-h3 font-black">{pet.name}</h2><p className="text-paw-type-caption text-paw-muted" role="status">{t(emotionLabels[emotion])} · {t("companionAiLabel")}</p></div>
          </div>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void mutate(() => api.startSession(pet.id), "", true)}>{t("companionNewChat")}</Button>
        </div>
        {notice ? <p role="status" className="mt-4 text-paw-type-caption text-paw-body">{t(notice)}</p> : null}
        <div className="my-5 max-h-96 min-h-48 space-y-4 overflow-y-auto overscroll-contain" role="log" aria-live="polite" aria-label={t("companionChat")}>
          {state.history.messages.length ? state.history.messages.map(message => <div key={message.id} className={`max-w-full rounded-paw-card p-4 ${message.role === "user" ? "ml-6 bg-paw-primary-soft" : "mr-6 bg-paw-panel-subtle"}`}>
            <p className="mb-1 text-paw-type-caption font-bold text-paw-body">{message.role === "user" ? t("companionYou") : pet.name}</p>
            <p className="whitespace-pre-wrap break-words leading-relaxed text-paw-ink">{message.text}</p>
          </div>) : <div className="py-8 text-paw-body"><p className="font-bold">{t("companionWelcome").replace("{name}", pet.name)}</p><p className="mt-2 leading-relaxed">{t("companionWelcomeBody")}</p></div>}
          {busy ? <p role="status" className="text-paw-type-caption text-paw-muted">{t("companionWorking")}</p> : null}
          <div ref={latestMessage} />
        </div>
        {reply?.context.episodes.length ? <details className="mb-4 rounded-paw-sm border border-paw-border p-3"><summary className="cursor-pointer font-bold">{t("companionSources")}</summary><ul className="mt-3 space-y-2">{reply.context.episodes.map(episode => <li key={episode.id} className="break-words text-paw-type-caption">{episode.text}</li>)}</ul></details> : null}
        <form onSubmit={send} className="space-y-3">
          <label htmlFor="companion-message" className="block font-bold">{t("companionMessage")}</label>
          <textarea id="companion-message" className={field} rows={3} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder={t("companionMessagePlaceholder")} disabled={busy} required />
          {state.settings.enabled ? <label className="flex min-h-paw-min-tap items-center gap-3 text-paw-type-caption"><input type="checkbox" className="h-5 w-5 shrink-0 accent-amber-600" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={busy} />{t("companionRememberMessage")}</label> : null}
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-paw-type-caption text-paw-muted">{t("companionChatSaved")}</span><Button type="submit" disabled={busy || !draft.trim()}>{busy ? t("companionWorking") : error ? t("companionRetrySend") : t("companionSend")}</Button></div>
        </form>
      </section>
      <aside className={`${panel} min-w-0 space-y-5`} aria-label={t("companionMemories")}>
        <div><h2 className="text-paw-type-h3 font-black">{t("companionMemories")}</h2><p className="mt-2 text-paw-type-caption leading-relaxed text-paw-body">{t("companionMemoryExplanation")}</p></div>
        <div className="rounded-paw-sm bg-paw-panel-subtle p-4"><p className="mb-3 font-bold">{state.settings.enabled ? t("companionLearningOn") : t("companionLearningOff")}</p><p className="mb-4 text-paw-type-caption text-paw-body">{state.settings.enabled ? t("companionDisableExplanation") : t("companionEnableExplanation")}</p><Button size="sm" variant="secondary" className="w-full" disabled={busy} onClick={() => void mutate(() => api.call(state.settings.enabled ? "settings.revoke" : "settings.enable", { pet_id: pet.id, expected_epoch: state.settings.consent_epoch, request_id: crypto.randomUUID() }), state.history.session_id, true)}>{state.settings.enabled ? t("companionDisable") : t("companionEnable")}</Button></div>
        {state.settings.enabled ? <NoteForm key={state.settings.consent_epoch} disabled={busy} t={t} onSave={(text, requestId, eventAt) => mutate(() => api.call("source.record", { pet_id: pet.id, request_id: requestId, expected_epoch: state.settings.consent_epoch, text, event_at: eventAt }))} /> : null}
        <div><h3 className="mb-3 font-bold">{t("companionSavedMemories")}</h3>{state.memories.memories.length ? <ul className="space-y-4">{state.memories.memories.map(memory => <li key={memory.id} className="rounded-paw-sm border border-paw-border p-3">
          <p className="whitespace-pre-wrap break-words text-paw-type-body">{memory.content}</p><p className="mt-2 text-paw-type-caption text-paw-muted">{t("companionSourceNote")} · {new Date(memory.event_at).toLocaleDateString(locale)}</p>
          <details className="mt-2 text-paw-type-caption text-paw-muted"><summary className="cursor-pointer">{t("companionSourceDetails")}</summary><p className="mt-2 break-all">{t("companionSourceId")}: {memory.source_id}</p></details>
          <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditing(memory); setReplacement(memory.content); }}>{t("companionCorrect")}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void feedback(memory, "forget")}>{t("companionForget")}</Button></div>
          {editing?.id === memory.id ? <form className="mt-3 space-y-3" onSubmit={event => { event.preventDefault(); void feedback(memory, "correct"); }}><label className="block font-bold" htmlFor="companion-correction">{t("companionCorrection")}</label><textarea id="companion-correction" rows={3} maxLength={4000} className={field} value={replacement} onChange={event => setReplacement(event.target.value)} disabled={busy} required /><div className="flex flex-wrap gap-2"><Button size="sm" type="submit" disabled={busy || !replacement.trim()}>{t("companionSave")}</Button><Button size="sm" variant="ghost" type="button" disabled={busy} onClick={() => setEditing(null)}>{t("companionCancel")}</Button></div></form> : null}
        </li>)}</ul> : <p className="text-paw-type-caption text-paw-muted">{t("companionNoMemories")}</p>}{state.memories.next_cursor ? <Button className="mt-4" variant="secondary" disabled={busy} onClick={() => void moreMemories()}>{t("companionMore")}</Button> : null}</div>
      </aside>
    </div>}
  </>;
}

function NoteForm({ t, disabled, onSave }: { t: Translate; disabled: boolean; onSave: (text: string, requestId: string, eventAt: string) => Promise<boolean | undefined> }) {
  const [text, setText] = useState("");
  const pending = useRef<{ text: string; requestId: string; eventAt: string } | null>(null);
  return <form className="space-y-3" onSubmit={event => {
    event.preventDefault();
    const note = text.trim();
    if (!note) return;
    if (pending.current?.text !== note) pending.current = { text: note, requestId: crypto.randomUUID(), eventAt: new Date().toISOString() };
    void onSave(note, pending.current.requestId, pending.current.eventAt).then(saved => { if (saved) { setText(""); pending.current = null; } });
  }}><label htmlFor="companion-note" className="block font-bold">{t("companionAddMemory")}</label><textarea id="companion-note" className={field} rows={3} maxLength={4000} value={text} onChange={event => setText(event.target.value)} placeholder={t("companionNotePlaceholder")} disabled={disabled} required /><Button size="sm" type="submit" variant="secondary" disabled={disabled || !text.trim()}>{t("companionSaveMemory")}</Button></form>;
}
