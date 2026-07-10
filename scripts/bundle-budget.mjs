import { spawn } from "node:child_process";
import { constants as zlibConstants, gzipSync } from "node:zlib";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INITIAL_BUDGET_BYTES = 5 * 1024;
const DEFERRED_BUDGET_BYTES = 20 * 1024;

function parseArguments(argv) {
  const options = {
    base: process.env.P3GB3_BUNDLE_BASE_REF || "origin/main",
    head: process.env.P3GB3_BUNDLE_HEAD_REF || "HEAD",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--base" || argument === "--head") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a git ref.`);
      options[argument.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function waitForExit(child, commandLabel, stderrChunks = []) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const detail = Buffer.concat(stderrChunks).toString("utf8").trim();
      reject(
        new Error(
          `${commandLabel} failed (${signal ? `signal ${signal}` : `exit ${code}`})${
            detail ? `:\n${detail}` : ""
          }`,
        ),
      );
    });
  });
}

async function commandOutput(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdoutChunks = [];
  const stderrChunks = [];
  child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
  child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
  await waitForExit(child, `${command} ${args.join(" ")}`, stderrChunks);
  return Buffer.concat(stdoutChunks).toString("utf8").trim();
}

async function runStreaming(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stderrChunks = [];
  child.stdout.on("data", (chunk) => process.stderr.write(chunk));
  child.stderr.on("data", (chunk) => {
    stderrChunks.push(chunk);
    process.stderr.write(chunk);
  });
  await waitForExit(child, `${command} ${args.join(" ")}`, stderrChunks);
}

async function exportRef(ref, destination) {
  await mkdir(destination, { recursive: true });

  const archive = spawn("git", ["archive", "--format=tar", ref], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const extract = spawn("tar", ["-x", "-f", "-", "-C", destination], {
    stdio: ["pipe", "ignore", "pipe"],
  });
  const archiveErrors = [];
  const extractErrors = [];
  archive.stderr.on("data", (chunk) => archiveErrors.push(chunk));
  extract.stderr.on("data", (chunk) => extractErrors.push(chunk));
  archive.stdout.pipe(extract.stdin);

  await Promise.all([
    waitForExit(archive, `git archive ${ref}`, archiveErrors),
    waitForExit(extract, `tar extract ${ref}`, extractErrors),
  ]);
}

function gzipBytes(buffer) {
  return gzipSync(buffer, { level: zlibConstants.Z_BEST_COMPRESSION }).length;
}

async function measureChunkSet(nextDir, files) {
  const uniqueFiles = [...new Set(files)].sort();
  const chunks = [];

  for (const file of uniqueFiles) {
    if (!file.startsWith("static/chunks/") || !file.endsWith(".js") || file.includes("..")) {
      throw new Error(`Unexpected JavaScript chunk path: ${file}`);
    }
    const buffer = await readFile(path.join(nextDir, file));
    chunks.push({ file, rawBytes: buffer.length, gzipBytes: gzipBytes(buffer) });
  }

  return {
    chunks,
    rawBytes: chunks.reduce((total, chunk) => total + chunk.rawBytes, 0),
    gzipBytes: chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0),
  };
}

async function homepageInitialChunks(nextDir) {
  const htmlPath = path.join(nextDir, "server", "app", "index.html");
  const html = await readFile(htmlPath, "utf8");
  const files = [...html.matchAll(/<script[^>]+src="\/_next\/(static\/chunks\/[^"?]+\.js)(?:\?[^\"]*)?"/g)].map(
    (match) => match[1],
  );
  if (files.length === 0) {
    throw new Error(`No homepage initial JavaScript chunks found in ${htmlPath}.`);
  }
  return measureChunkSet(nextDir, files);
}

function requireManifestEntry(manifest, description, matcher) {
  const matches = Object.entries(manifest).filter(([key]) => matcher(key));
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${description} entry in react-loadable-manifest.json, found ${matches.length}.`,
    );
  }
  return { key: matches[0][0], files: matches[0][1].files || [] };
}

async function globeDeferredChunks(nextDir) {
  const manifestPath = path.join(nextDir, "react-loadable-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const globeComponent = requireManifestEntry(
    manifest,
    "Globe -> GlobeComponent",
    (key) => /(?:^|\/)components\/Globe\.tsx -> \.\/GlobeComponent$/.test(key),
  );
  const reactGlobe = requireManifestEntry(
    manifest,
    "GlobeComponent -> react-globe.gl",
    (key) => /(?:^|\/)components\/GlobeComponent\.tsx -> react-globe\.gl$/.test(key),
  );
  const files = [...globeComponent.files, ...reactGlobe.files].filter((file) => file.endsWith(".js"));
  if (files.length === 0) throw new Error("Globe deferred chunk union was empty.");

  return {
    ...(await measureChunkSet(nextDir, files)),
    manifestEntries: [globeComponent.key, reactGlobe.key],
  };
}

async function buildAndMeasure(label, ref, commit, workspace, buildEnvironment) {
  console.error(`\n[${label}] Exporting ${ref} (${commit.slice(0, 12)}) with git archive...`);
  await exportRef(commit, workspace);
  console.error(`[${label}] Installing locked dependencies...`);
  await runStreaming("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], {
    cwd: workspace,
    env: buildEnvironment,
  });
  console.error(`[${label}] Building production bundle...`);
  await runStreaming("npm", ["run", "build"], { cwd: workspace, env: buildEnvironment });

  const nextDir = path.join(workspace, ".next");
  return {
    label,
    ref,
    commit,
    initial: await homepageInitialChunks(nextDir),
    deferred: await globeDeferredChunks(nextDir),
  };
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function formatDelta(bytes) {
  return `${bytes >= 0 ? "+" : "-"}${formatBytes(Math.abs(bytes))}`;
}

function printTable(rows) {
  const widths = rows[0].map((_, column) =>
    Math.max(...rows.map((row) => String(row[column]).length)),
  );
  for (const row of rows) {
    console.log(row.map((cell, column) => String(cell).padEnd(widths[column])).join(" | "));
  }
}

function printChunkDetails(result, metricName, measurement) {
  console.log(`\n${result.label.toUpperCase()} ${metricName} CHUNKS (${result.ref} @ ${result.commit.slice(0, 12)})`);
  printTable([
    ["Chunk", "Raw", "Gzip"],
    ...measurement.chunks.map((chunk) => [
      chunk.file,
      formatBytes(chunk.rawBytes),
      formatBytes(chunk.gzipBytes),
    ]),
    ["TOTAL", formatBytes(measurement.rawBytes), formatBytes(measurement.gzipBytes)],
  ]);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const [baseCommit, headCommit, npmVersion] = await Promise.all([
    commandOutput("git", ["rev-parse", "--verify", `${options.base}^{commit}`]),
    commandOutput("git", ["rev-parse", "--verify", `${options.head}^{commit}`]),
    commandOutput("npm", ["--version"]),
  ]);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pawpal-p3gb3-bundle-"));
  const buildEnvironment = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
  };

  try {
    console.error(`Temporary build root: ${tempRoot}`);
    const base = await buildAndMeasure(
      "base",
      options.base,
      baseCommit,
      path.join(tempRoot, "base"),
      buildEnvironment,
    );
    const head = await buildAndMeasure(
      "head",
      options.head,
      headCommit,
      path.join(tempRoot, "head"),
      buildEnvironment,
    );

    const initialDelta = head.initial.gzipBytes - base.initial.gzipBytes;
    const deferredDelta = head.deferred.gzipBytes - base.deferred.gzipBytes;
    const initialPassed = initialDelta <= INITIAL_BUDGET_BYTES;
    const deferredPassed = deferredDelta <= DEFERRED_BUDGET_BYTES;

    console.log("P3GB3 BUNDLE BUDGET (Node built-in zlib, gzip level 9)");
    console.log(`Node: ${process.version}`);
    console.log(`npm: ${npmVersion}`);
    console.log(`Base: ${options.base} -> ${baseCommit}`);
    console.log(`Head: ${options.head} -> ${headCommit}`);
    console.log("Build isolation: temporary git archive exports; no clone and no source worktree mutation.");
    console.log("\nBUDGET SUMMARY");
    printTable([
      ["Metric", "Budget", "Base gzip", "Head gzip", "Delta", "Status"],
      [
        "Homepage initial JS",
        "<= +5.00 KiB",
        formatBytes(base.initial.gzipBytes),
        formatBytes(head.initial.gzipBytes),
        formatDelta(initialDelta),
        initialPassed ? "PASS" : "FAIL",
      ],
      [
        "Globe deferred JS union",
        "<= +20.00 KiB",
        formatBytes(base.deferred.gzipBytes),
        formatBytes(head.deferred.gzipBytes),
        formatDelta(deferredDelta),
        deferredPassed ? "PASS" : "FAIL",
      ],
    ]);

    console.log("\nDEFERRED MANIFEST CHAIN");
    for (const entry of head.deferred.manifestEntries) console.log(`- ${entry}`);
    printChunkDetails(base, "homepage initial JS", base.initial);
    printChunkDetails(head, "homepage initial JS", head.initial);
    printChunkDetails(base, "Globe deferred JS union", base.deferred);
    printChunkDetails(head, "Globe deferred JS union", head.deferred);

    if (!initialPassed || !deferredPassed) {
      console.error("P3GB3 bundle budget failed.");
      process.exitCode = 1;
    } else {
      console.log("\nP3GB3 bundle budget passed.");
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  console.error(error?.stack || error);
  process.exitCode = 1;
}
