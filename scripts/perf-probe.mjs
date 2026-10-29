const baseUrl = process.env.PERF_BASE_URL ?? "http://localhost:3000";
const samples = Number.parseInt(process.env.PERF_PROBE_SAMPLES ?? "7", 10);
const budgetMs = Number.parseFloat(process.env.PERF_BUDGET_MS ?? "500");
const timeoutMs = Number.parseInt(process.env.PERF_PROBE_TIMEOUT_MS ?? "10000", 10);

const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/api/health",
  },
  {
    name: "search-auth-rejection",
    expectedStatus: 401,
    method: "POST",
    path: "/api/search",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "dog park", limit: 5 }),
  },
];

function percentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

function formatMs(value) {
  return `${value.toFixed(1)}ms`;
}

function describeError(error) {
  if (!(error instanceof Error)) return String(error);
  if (error.cause instanceof Error) {
    return `${error.message}: ${error.cause.message}`;
  }
  return error.message;
}

async function timedFetch(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(new URL(endpoint.path, baseUrl), {
      method: endpoint.method,
      headers: endpoint.headers,
      body: endpoint.body,
      signal: controller.signal,
    });
    const text = await response.text();
    const elapsedMs = performance.now() - startedAt;

    return {
      ok: response.status < 500,
      status: response.status,
      elapsedMs,
      bytes: Buffer.byteLength(text),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const failures = [];

console.log(`PawPal website perf probe (search measures anonymous auth rejection, not successful AI latency)`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Samples: ${samples}`);
console.log(`Budget: P95 < ${formatMs(budgetMs)}`);
console.log("");

for (const endpoint of endpoints) {
  const results = [];

  for (let i = 0; i < samples; i += 1) {
    try {
      results.push(await timedFetch(endpoint));
    } catch (error) {
      failures.push(`${endpoint.name} sample ${i + 1} failed: ${describeError(error)}`);
      results.push({
        ok: false,
        status: 0,
        elapsedMs: timeoutMs,
        bytes: 0,
      });
    }
  }

  const latencies = results.map((result) => result.elapsedMs);
  const statusCounts = results.reduce((counts, result) => {
    counts.set(result.status, (counts.get(result.status) ?? 0) + 1);
    return counts;
  }, new Map());
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const max = Math.max(...latencies);
  const minBytes = Math.min(...results.map((result) => result.bytes));
  const maxBytes = Math.max(...results.map((result) => result.bytes));
  const statuses = [...statusCounts.entries()]
    .map(([status, count]) => `${status}:${count}`)
    .join(", ");

  console.log(
    `${endpoint.method} ${endpoint.path} ` +
      `statuses=[${statuses}] ` +
      `p50=${formatMs(p50)} p95=${formatMs(p95)} max=${formatMs(max)} ` +
      `bytes=${minBytes}-${maxBytes}`
  );

  if (results.some((result) => result.status === 0)) {
    failures.push(`${endpoint.name} had one or more request failures before a response`);
  }

  if (endpoint.expectedStatus && results.some((result) => result.status !== endpoint.expectedStatus)) {
    failures.push(`${endpoint.name} did not return the expected anonymous ${endpoint.expectedStatus} rejection`);
  }

  if (results.some((result) => result.status >= 500)) {
    failures.push(`${endpoint.name} returned one or more 5xx responses`);
  }

  if (p95 >= budgetMs) {
    failures.push(
      `${endpoint.name} P95 ${formatMs(p95)} exceeded ${formatMs(budgetMs)}`
    );
  }
}

if (failures.length > 0) {
  console.log("");
  console.log("FAIL");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("");
  console.log("PASS");
}
