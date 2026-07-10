import assert from "node:assert/strict";
import {
  HOME_GLOBE_CACHE_CONTROL,
  createHomeGlobePostsResponse,
} from "../src/lib/homeGlobePosts.ts";

const validRow = {
  id: "031b1000-0000-4000-8000-000000000102",
  display_lat: 51.1,
  display_lng: 3.7,
  region_key: "u1",
  location_label: "Ghent",
  category: "custom",
  pin_icon: "paw",
  snippet: "A real post",
  like_count: 4,
  comment_count: 2,
  created_at: "2026-07-10T08:00:00.000Z",
  expires_at: null,
};

function mockRpc(result) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(functionName, args) {
        calls.push({ functionName, args });
        return result;
      },
    },
  };
}

const emptyRpc = mockRpc({ data: [], error: null });
const emptyResponse = await createHomeGlobePostsResponse(emptyRpc.client);
assert.equal(emptyResponse.status, 200);
assert.equal(emptyResponse.headers.get("cache-control"), HOME_GLOBE_CACHE_CONTROL);
assert.deepEqual(await emptyResponse.json(), []);
assert.deepEqual(emptyRpc.calls, [
  {
    functionName: "homepage_globe_hot_posts",
    args: { p_limit: 12 },
  },
]);
console.log("PASS 200 [] represents a real empty RPC result.");

const failedResponse = await createHomeGlobePostsResponse(
  mockRpc({ data: null, error: { message: "database unavailable" } }).client,
);
assert.equal(failedResponse.status, 503);
assert.equal(failedResponse.headers.get("cache-control"), HOME_GLOBE_CACHE_CONTROL);
assert.deepEqual(await failedResponse.json(), {
  error: "Home globe posts are temporarily unavailable.",
});

const thrownResponse = await createHomeGlobePostsResponse({
  async rpc() {
    throw new Error("network unavailable");
  },
});
assert.equal(thrownResponse.status, 503);

const malformedResponse = await createHomeGlobePostsResponse(
  mockRpc({ data: { rows: [] }, error: null }).client,
);
assert.equal(malformedResponse.status, 503);
console.log("PASS RPC errors, throws, and malformed payloads return 503.");

const rowsRpc = mockRpc({
  data: [
    {
      ...validRow,
      author_id: "must-not-leak",
      image_url: "https://example.test/must-not-leak.jpg",
      lat: 51.054321,
      lng: 3.717456,
    },
    { ...validRow, id: "bad-lat", display_lat: 90.1 },
    { ...validRow, id: "bad-lng", display_lng: -180.1 },
    { ...validRow, id: "not-rounded", display_lat: 51.12 },
    { ...validRow, id: "negative-count", like_count: -1 },
    { ...validRow, id: "invalid-date", created_at: "not-a-date" },
    { ...validRow, id: "invalid-region", region_key: "a1" },
    { ...validRow, id: "long-snippet", snippet: "🐾".repeat(65) },
    (() => {
      const missingField = { ...validRow };
      delete missingField.pin_icon;
      return missingField;
    })(),
  ],
  error: null,
});

const filteredResponse = await createHomeGlobePostsResponse(rowsRpc.client);
assert.equal(filteredResponse.status, 200);
assert.equal(filteredResponse.headers.get("cache-control"), HOME_GLOBE_CACHE_CONTROL);
const filteredRows = await filteredResponse.json();
assert.deepEqual(filteredRows, [validRow]);
assert.deepEqual(Object.keys(filteredRows[0]).sort(), Object.keys(validRow).sort());
assert.equal("author_id" in filteredRows[0], false);
assert.equal("image_url" in filteredRows[0], false);
assert.equal("lat" in filteredRows[0], false);
assert.equal("lng" in filteredRows[0], false);
console.log("PASS invalid rows are dropped and unexpected fields cannot leak.");

console.log("Homepage globe Route Handler contract checks passed.");
