import type { Session } from "@supabase/supabase-js";

// Account identity alone is insufficient for A -> sign out -> A. This local
// generation changes at account boundaries, not ordinary token refreshes.
export function createAuthSessionScope() {
  let snapshot: { session: Session | null; loading: boolean; generation: number } = {
    session: null, loading: true, generation: 0,
  };
  return {
    get snapshot() { return snapshot; },
    accept(session: Session | null, signedOut = false) {
      const changed = snapshot.loading || signedOut || snapshot.session?.user.id !== session?.user.id;
      snapshot = { session, loading: false, generation: snapshot.generation + (changed ? 1 : 0) };
      return snapshot;
    },
    getSessionForGeneration(generation: number) {
      return !snapshot.loading && generation === snapshot.generation ? snapshot.session : null;
    },
  };
}
