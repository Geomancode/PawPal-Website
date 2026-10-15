import { NextResponse } from "next/server";
import { supabaseServer, createUserScopedSupabaseClient } from "@/lib/supabaseServer";

export class StoreIdentityError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
  }
}

export function privateStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
}

/** A caller-supplied account ID or shipping email never proves ownership. */
export async function requireStoreUser(req: { headers: Headers }) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!match) throw new StoreIdentityError(401, "sign_in_required");
  const token = match[1];
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) throw new StoreIdentityError(401, "sign_in_required");
  return { userId: data.user.id, client: createUserScopedSupabaseClient(token) };
}
