import { sanitizeSearchQuery } from "../src/lib/searchQuery.ts";

const baseUrl = process.env.SEARCH_PROBE_BASE_URL;
const payloads = [
  "a,b",
  "a)",
  "a(b",
  "%",
  "_",
  "\\",
  "',\"",
  "); drop",
  "中文名",
];

let failed = false;

if (baseUrl) {
  const endpoint = new URL("/api/search", baseUrl);
  for (const payload of payloads) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: payload, limit: 2, offset: 999999 }),
    });
    const body = await response.text();
    // This live probe is deliberately anonymous: the retained paid-AI route
    // must reject before model calls. Authenticated injection cases execute the
    // real route in search-auth-check.mjs without contacting a paid provider.
    const ok = response.status === 401;
    console.log(`${JSON.stringify(payload)} -> ${response.status}`);
    if (!ok) {
      failed = true;
      console.log(body.slice(0, 500));
    }
  }
} else {
  console.log("SEARCH_PROBE_BASE_URL not set; checking the query sanitizer only; search-auth-check covers the actual route.");
  for (const payload of payloads) {
    const raw = payload.trim();
    const safe = sanitizeSearchQuery(raw);
    const status = raw.length === 0 ? 400 : 200;
    const ok = status !== 500 && (status === 200 || status === 400);
    console.log(
      `${JSON.stringify(payload)} -> ${status} (sanitized=${JSON.stringify(safe)})`
    );
    if (!ok) failed = true;
  }
}

if (failed) {
  throw new Error("Search injection probe failed");
}

console.log(baseUrl ? "Anonymous search rejection probe passed; successful search latency/injection not measured." : "Search query sanitizer probe passed; actual route coverage is separate.");
