"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { createAuthSessionScope } from "@/lib/authSessionScope";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authGeneration: number;
  getSessionForGeneration: (generation: number) => Session | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [scope] = useState(createAuthSessionScope);
  const [state, setState] = useState(scope.snapshot);
  const { session, loading, generation: authGeneration } = state;
  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;
    let observedEvents = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      observedEvents++;
      // The synchronous scope update also fences async continuations before
      // React commits the corresponding account-change render.
      setState(scope.accept(nextSession, event === "SIGNED_OUT"));
    });
    const initialVersion = observedEvents;
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (active && observedEvents === initialVersion) setState(scope.accept(initialSession));
    }).catch(() => {
      if (active && observedEvents === initialVersion) setState(scope.accept(null));
      console.warn("Initial authentication session could not be read");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [scope]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: friendlyError(error.message) };
    return { error: null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName?.trim() || undefined,
        },
      },
    });
    if (error) return { error: friendlyError(error.message), needsConfirm: false };
    // Supabase may require email confirmation
    const needsConfirm = !!data.user && !data.session;
    return { error: null, needsConfirm };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authGeneration, getSessionForGeneration: scope.getSessionForGeneration, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function friendlyError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login")) return "Incorrect email or password.";
  if (msg.includes("email already")) return "This email is already registered.";
  if (msg.includes("weak password")) return "Password must be at least 6 characters.";
  if (msg.includes("rate limit")) return "Too many attempts. Please wait a minute.";
  if (msg.includes("network")) return "Network error. Check your connection.";
  return raw;
}
