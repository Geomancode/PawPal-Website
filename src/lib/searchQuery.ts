const UNSAFE_FILTER_CHARS = new Set([
  ",",
  "(",
  ")",
  "\\",
  "%",
  "_",
  "'",
  "\"",
  ";",
  "{",
  "}",
]);

export const SEARCH_QUERY_MAX_LENGTH = 100;
export const SEARCH_DEFAULT_LIMIT = 10;
export const SEARCH_MAX_LIMIT = 50;

export type SearchPagination = {
  limit: number;
  offset: number;
  page: number;
};

export function sanitizeSearchQuery(
  input: string,
  maxLength = SEARCH_QUERY_MAX_LENGTH
): string {
  if (maxLength <= 0) return "";

  const trimmed = input.trim();
  if (!trimmed) return "";

  let output = "";
  for (const char of Array.from(trimmed)) {
    if (UNSAFE_FILTER_CHARS.has(char)) continue;
    output += char;
    if (Array.from(output).length >= maxLength) break;
  }

  return output.trim();
}

export function buildIlikeContainsPattern(input: string): string | null {
  const safe = sanitizeSearchQuery(input);
  return safe ? `%${safe}%` : null;
}

export function buildOrIlikeContainsFilter(
  columns: readonly string[],
  input: string
): string | null {
  const safe = sanitizeSearchQuery(input);
  const safeColumns = columns.map((column) => column.trim()).filter(Boolean);
  if (!safe || safeColumns.length === 0) return null;
  return safeColumns.map((column) => `${column}.ilike.%${safe}%`).join(",");
}

export function parseSearchPagination(
  input: { limit?: unknown; offset?: unknown; page?: unknown } = {},
  options: { defaultLimit?: number; maxLimit?: number } = {}
): SearchPagination {
  const defaultLimit = options.defaultLimit ?? SEARCH_DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? SEARCH_MAX_LIMIT;
  const rawLimit = numberFromUnknown(input.limit);
  const rawOffset = numberFromUnknown(input.offset);
  const rawPage = numberFromUnknown(input.page);

  const limit = clampLimit(rawLimit, defaultLimit, maxLimit);
  const page = rawPage && rawPage > 0 ? Math.floor(rawPage) : 1;
  const offset =
    rawOffset !== null && rawOffset >= 0
      ? Math.floor(rawOffset)
      : (page - 1) * limit;

  return { limit, offset, page };
}

export function searchRange(pagination: SearchPagination): {
  from: number;
  to: number;
} {
  return {
    from: pagination.offset,
    to: pagination.offset + pagination.limit - 1,
  };
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clampLimit(
  value: number | null,
  defaultLimit: number,
  maxLimit: number
): number {
  if (!value || value <= 0) return defaultLimit;
  return Math.min(Math.floor(value), maxLimit);
}
