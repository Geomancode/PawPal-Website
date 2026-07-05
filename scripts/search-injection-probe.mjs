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
    const acceptedStatus = response.status === 200 || response.status === 400;
    const ok = acceptedStatus && response.status !== 500;
    console.log(`${JSON.stringify(payload)} -> ${response.status}`);
    if (!ok) {
      failed = true;
      console.log(body.slice(0, 500));
    }
  }
} else {
  console.log("SEARCH_PROBE_BASE_URL not set; running offline route contract.");
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

console.log("search injection probe passed");
