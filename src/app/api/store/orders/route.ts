import { NextRequest } from "next/server";
import { privateStoreJson, requireStoreUser, StoreIdentityError } from "@/lib/storeIdentity";
import { reportError } from "@/lib/errorReporting";

export async function GET(req: NextRequest) {
  try {
    const { client } = await requireStoreUser(req);
    let before: unknown = null;
    const raw = req.nextUrl.searchParams.get("before");
    if (raw) {
      try { before = JSON.parse(raw); }
      catch { return privateStoreJson({ error: "Invalid order cursor" }, 400); }
    }
    const { data, error } = await client.rpc("get_my_store_orders", { p_limit: 50, p_before: before });
    if (error) {
      if (error.code === "22023") return privateStoreJson({ error: "Invalid order cursor" }, 400);
      throw error;
    }
    return privateStoreJson(data);
  } catch (error) {
    if (error instanceof StoreIdentityError) return privateStoreJson({ error: error.code }, error.status);
    reportError(error, { route: "/api/store/orders", method: "GET" });
    return privateStoreJson({ error: "Orders are unavailable" }, 503);
  }
}
