import assert from "node:assert/strict";
import {
  SEARCH_QUERY_MAX_LENGTH,
  buildIlikeContainsPattern,
  buildOrIlikeContainsFilter,
  parseSearchPagination,
  sanitizeSearchQuery,
} from "../src/lib/searchQuery.ts";

const payloads = [
  "a,b",
  "a)",
  "a(b",
  "%",
  "_",
  "\\",
  "',\"",
  "); drop",
  "{cat}",
  "中文名",
];
const unsafeChars = [",", "(", ")", "\\", "%", "_", "'", "\"", ";", "{", "}"];

for (const payload of payloads) {
  const sanitized = sanitizeSearchQuery(payload);
  for (const char of unsafeChars) {
    assert.equal(
      sanitized.includes(char),
      false,
      `${payload} sanitized to ${sanitized} still contains ${char}`
    );
  }
  assert.equal(sanitized.length <= SEARCH_QUERY_MAX_LENGTH, true);
}

assert.equal(sanitizeSearchQuery("  中文名  "), "中文名");
assert.equal(sanitizeSearchQuery("Milo 123 - tabby"), "Milo 123 - tabby");
assert.equal(sanitizeSearchQuery("a,b"), "ab");
assert.equal(sanitizeSearchQuery("a)"), "a");
assert.equal(sanitizeSearchQuery("a(b"), "ab");
assert.equal(sanitizeSearchQuery("); drop"), "drop");
assert.equal(sanitizeSearchQuery("%"), "");
assert.equal(sanitizeSearchQuery("_"), "");
assert.equal(sanitizeSearchQuery("\\"), "");
assert.equal(sanitizeSearchQuery("',\""), "");
assert.equal(
  sanitizeSearchQuery("a".repeat(SEARCH_QUERY_MAX_LENGTH + 50)).length,
  SEARCH_QUERY_MAX_LENGTH
);

assert.equal(buildIlikeContainsPattern(" cat_% "), "%cat%");
assert.equal(buildIlikeContainsPattern("%"), null);
assert.equal(
  buildOrIlikeContainsFilter(["title", "quest_type"], "a,b_%"),
  "title.ilike.%ab%,quest_type.ilike.%ab%"
);

assert.deepEqual(parseSearchPagination({ limit: 500, offset: -10 }), {
  limit: 50,
  offset: 0,
  page: 1,
});
assert.deepEqual(parseSearchPagination({ limit: 5, page: 3 }), {
  limit: 5,
  offset: 10,
  page: 3,
});
assert.deepEqual(parseSearchPagination({ limit: 5, offset: 0, page: 3 }), {
  limit: 5,
  offset: 0,
  page: 3,
});

console.log("search-query contract checks passed");
