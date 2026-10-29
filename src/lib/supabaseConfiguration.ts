import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConfigurationError extends Error {
  readonly code = "supabase_configuration_unavailable";

  constructor() {
    super("The service is not configured. Please try again later.");
    this.name = "SupabaseConfigurationError";
  }
}

export function requireSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) throw new SupabaseConfigurationError();
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username ||
        url.password || url.search || url.hash) throw new SupabaseConfigurationError();
  } catch {
    throw new SupabaseConfigurationError();
  }
  return value;
}

export function requirePublicSupabaseConfiguration() {
  const url = requireSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new SupabaseConfigurationError();
  return { url, key };
}

/** Used by synchronous browser effects before touching the SDK. */
export function getSupabaseConfigurationError(): string | null {
  try {
    requirePublicSupabaseConfiguration();
    return null;
  } catch {
    return new SupabaseConfigurationError().message;
  }
}

/** Importing a page is safe; configuration is validated on first actual use. */
export function lazySupabaseClient(create: () => SupabaseClient): SupabaseClient {
  let client: SupabaseClient | undefined;
  return new Proxy({} as SupabaseClient, {
    get(_target, property) {
      // Do not initialize a client when a framework checks for a thenable.
      if (property === "then") return undefined;
      client ??= create();
      const value = Reflect.get(client, property, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}
