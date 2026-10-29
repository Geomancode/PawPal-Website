import type { SupabaseClient } from "@supabase/supabase-js";

const bucket = "pet-media";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const objectPattern = new RegExp(`^${uuid}/pet_media/${uuid}/${uuid}\\.(jpg|jpeg|png|webp|gif|heic|heif|mp4|mov)$`);

export function isPrivatePetMedia(value: string): boolean {
  try {
    return new URL(value).pathname.split("/").some((part) => decodeURIComponent(part) === bucket);
  } catch {
    // An encoded/malformed private marker must not fall back to a public loader.
    return /(?:pet-media|pet%2dmedia)/i.test(value);
  }
}

export function petMediaObjectPath(client: SupabaseClient, value: string): string {
  const url = new URL(value);
  const base = new URL(client.storage.from(bucket).getPublicUrl("").data.publicUrl);
  const prefix = base.pathname.replace("/object/public/", "/object/authenticated/");
  if (url.origin !== base.origin || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix)) {
    throw new Error("Untrusted pet media reference");
  }
  const path = url.pathname.slice(prefix.length);
  const canonical = client.storage.from(bucket).getPublicUrl(path).data.publicUrl.replace("/object/public/", "/object/authenticated/");
  if (!objectPattern.test(path) || value !== canonical) throw new Error("Invalid pet media identity");
  return path;
}

export type PetMediaState = { source: string; url: string | null; failed: boolean };
type ObjectURLs = { createObjectURL: (value: Blob) => string; revokeObjectURL: (value: string) => void };

/** Each instance owns only its own Blob URL; no persistent/disk/URL cache. */
export function observePetMedia(
  client: SupabaseClient,
  source: string,
  publish: (state: PetMediaState) => void,
  objectURLs: ObjectURLs = URL,
) {
  let epoch = 0;
  let owner: string | null | undefined;
  let stopped = false;
  let active = true;
  let failed = false;
  let currentURL: string | null = null;
  const clear = () => {
    epoch++;
    const old = currentURL;
    currentURL = null;
    failed = false;
    publish({ source, url: null, failed: false });
    if (old) objectURLs.revokeObjectURL(old);
  };
  const load = async (captured: number) => {
    if (stopped || !active || captured !== epoch) return;
    try {
      const path = petMediaObjectPath(client, source);
      const { data, error } = await client.storage.from(bucket).download(path, undefined, { cache: "no-store" });
      if (stopped || !active || captured !== epoch) return;
      if (error || !data) throw new Error("Pet media unavailable");
      currentURL = objectURLs.createObjectURL(data);
      failed = false;
      publish({ source, url: currentURL, failed: false });
    } catch {
      if (stopped || !active || captured !== epoch) return;
      failed = true;
      publish({ source, url: null, failed: true });
      console.warn("Pet media authorization or download failed");
    }
  };
  const start = () => {
    clear();
    const captured = epoch;
    // Never await another SDK call from inside the SDK's auth-lock callback.
    queueMicrotask(() => { void load(captured); });
  };
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    if (stopped) return;
    const nextOwner = session?.user.id ?? null;
    if (owner === undefined || owner !== nextOwner || event === "SIGNED_OUT" ||
        (failed && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION"))) {
      owner = nextOwner;
      start();
    }
  });
  return {
    setActive(value: boolean) {
      if (stopped || active === value) return;
      active = value;
      if (active) start(); else clear();
    },
    dispose() {
      stopped = true;
      subscription.unsubscribe();
      clear();
    },
  };
}
