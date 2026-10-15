import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type CompanionPet = {
  id: string;
  name: string;
  species_group: string | null;
  breed: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
};
export type CompanionSettings = {
  enabled: boolean;
  consent_epoch: number;
  memory_revision: number;
  invalidation_revision: number;
};
export type CompanionSession = { session_id: string; pet_id: string; mode: "companion" };
export type CompanionMessage = { id: string; role: "user" | "assistant"; text: string; created_at: string };
export type CompanionHistory = {
  pet_id: string;
  session_id: string;
  messages: CompanionMessage[];
  consent_epoch: number;
  invalidation_revision: number;
};
export type CompanionMemory = {
  id: string;
  pet_id: string;
  source_id: string;
  source_revision: number;
  content: string;
  event_at: string;
  version: number;
};
export type MemoryPage = {
  memories: CompanionMemory[];
  next_cursor: Record<string, unknown> | null;
  memory_revision: number;
  invalidation_revision: number;
};
export type CompanionEmotion = "happy" | "calm" | "curious" | "comforting";
export type CompanionReply = {
  reply: string;
  pet_id: string;
  session_id: string;
  request_id: string;
  emotion: CompanionEmotion;
  context: {
    pet_id: string;
    session_id: string;
    consent_epoch: number;
    invalidation_revision: number;
    episodes: { id: string; text: string; evidence_ids: string[] }[];
  };
};

export class CompanionError extends Error {
  constructor(public readonly code: string) { super(code); }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CompanionError("invalid_response");
  return value as Record<string, unknown>;
}
function string(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value) throw new CompanionError("invalid_response");
}
function integer(value: unknown) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new CompanionError("invalid_response");
}
function scope(value: Record<string, unknown>, petId: string, sessionId?: string) {
  if (value.pet_id !== petId || (sessionId && value.session_id !== sessionId)) throw new CompanionError("invalid_response");
}
function session(value: unknown, petId: string): CompanionSession {
  const data = object(value);
  scope(data, petId);
  string(data.session_id);
  if (data.mode !== "companion") throw new CompanionError("invalid_response");
  return data as CompanionSession;
}
function safeError(value: unknown): CompanionError {
  const codes = new Set(["unauthenticated", "learning_disabled", "version_conflict", "stale_turn", "generation_in_progress", "rate_limited", "model_unconfigured", "model_unavailable", "source_limit_reached", "idempotency_conflict", "resource_unavailable", "invalid_request"]);
  const code = typeof value === "object" && value !== null && "code" in value ? value.code : undefined;
  return new CompanionError(typeof code === "string" && codes.has(code) ? code : "temporarily_unavailable");
}

/** Both clients use the same authenticated Edge service. Model credentials never enter the browser. */
export class CompanionClient {
  constructor(private readonly ownerId: string) {}

  async call(operation: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const { data: { session: auth } } = await supabase.auth.getSession();
    if (!auth || auth.user.id !== this.ownerId) throw new CompanionError("unauthenticated");
    const { data, error } = await supabase.functions.invoke("companion-chat", { body: { operation, ...args } });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        let body: unknown;
        try { body = await error.context.json(); } catch { throw new CompanionError("temporarily_unavailable"); }
        throw safeError(object(body).error);
      }
      throw new CompanionError("temporarily_unavailable");
    }
    const result = object(data);
    if (result.error) throw safeError(result.error);
    return result;
  }

  async pets(): Promise<CompanionPet[]> {
    const data = await this.call("pets.list");
    if (!Array.isArray(data.pets)) throw new CompanionError("invalid_response");
    return data.pets.map((pet) => {
      const value = object(pet);
      string(value.id); string(value.name);
      return value as CompanionPet;
    });
  }

  async settings(petId: string): Promise<CompanionSettings> {
    const data = await this.call("settings.get", { pet_id: petId });
    if (typeof data.enabled !== "boolean") throw new CompanionError("invalid_response");
    integer(data.consent_epoch); integer(data.memory_revision); integer(data.invalidation_revision);
    return data as CompanionSettings;
  }

  async latestSession(petId: string): Promise<CompanionSession> {
    const result = await this.call("session.latest", { pet_id: petId });
    return result.session ? session(result.session, petId) : this.startSession(petId);
  }

  async startSession(petId: string): Promise<CompanionSession> {
    return session(await this.call("session.start", { pet_id: petId, request_id: crypto.randomUUID() }), petId);
  }

  async history(petId: string, sessionId: string): Promise<CompanionHistory> {
    const data = await this.call("chat.history", { pet_id: petId, session_id: sessionId });
    scope(data, petId, sessionId);
    integer(data.consent_epoch); integer(data.invalidation_revision);
    if (!Array.isArray(data.messages)) throw new CompanionError("invalid_response");
    data.messages.forEach((message) => {
      const value = object(message);
      string(value.id); string(value.text); string(value.created_at);
      if (value.role !== "user" && value.role !== "assistant") throw new CompanionError("invalid_response");
    });
    return data as CompanionHistory;
  }

  async memories(petId: string, cursor?: Record<string, unknown>): Promise<MemoryPage> {
    const data = await this.call("memory.list", { pet_id: petId, limit: 20, ...(cursor ? { cursor } : {}) });
    integer(data.memory_revision); integer(data.invalidation_revision);
    if (!Array.isArray(data.memories)) throw new CompanionError("invalid_response");
    data.memories.forEach((item) => {
      const memory = object(item);
      scope(memory, petId); string(memory.id); string(memory.source_id); string(memory.content); string(memory.event_at);
      integer(memory.version); integer(memory.source_revision);
    });
    return { memories: data.memories as CompanionMemory[], next_cursor: data.next_cursor ? object(data.next_cursor) : null, memory_revision: data.memory_revision as number, invalidation_revision: data.invalidation_revision as number };
  }

  async send(args: { pet_id: string; session_id: string; request_id: string; message: string; expected_epoch: number; expected_invalidation_revision: number; remember: boolean }): Promise<CompanionReply> {
    const data = await this.call("chat.send", args);
    scope(data, args.pet_id, args.session_id); string(data.reply);
    if (data.request_id !== args.request_id) throw new CompanionError("invalid_response");
    const context = object(data.context);
    scope(context, args.pet_id, args.session_id);
    integer(context.consent_epoch); integer(context.invalidation_revision);
    if (!Array.isArray(context.episodes) || !["happy", "calm", "curious", "comforting"].includes(String(data.emotion))) throw new CompanionError("invalid_response");
    context.episodes.forEach((item) => {
      const episode = object(item); string(episode.id); string(episode.text);
      if (!Array.isArray(episode.evidence_ids) || episode.evidence_ids.length === 0 || episode.evidence_ids.some(id => typeof id !== "string")) throw new CompanionError("invalid_response");
    });
    return data as CompanionReply;
  }
}
