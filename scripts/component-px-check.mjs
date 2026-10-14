import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repoRoot, "src");

// Key format: file:line:occurrence:match. Every exception is tied to one
// value-preserving component geometry decision and must retain its own reason.
const allowlistEntries = [
  ["src/app/[locale]/(streamed)/about/page.tsx:301:1:[18px]", "A7 component one-off geometry: the decorative timeline marker has a local 18px left inset."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:175:1:[96px]", "A1 shell-top historical variant: 值保真保留的历史不一致；候选未来 shell-top 对齐批统一后移除。"],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:177:1:[48px]", "A2 control/icon geometry: the park-risk gate icon keeps its dedicated 48px height."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:177:2:[48px]", "A2 control/icon geometry: the park-risk gate icon keeps its dedicated 48px width."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:178:1:[288px]", "A5 skeleton/panel geometry: the park-risk loading panel preserves its 288px minimum height."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:179:1:[28px]", "A2 control/icon geometry: the park-risk loading spinner preserves its 28px height."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:179:2:[28px]", "A2 control/icon geometry: the park-risk loading spinner preserves its 28px width."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:682:1:[minmax(0,1.35fr)_minmax(360px,0.65fr)]", "A6 grid track geometry: the park-risk review split keeps its 360px secondary-track floor."],
  ["src/app/[locale]/(streamed)/admin/park-risks/page.tsx:965:1:[minmax(0,1fr)_280px]", "A6 grid track geometry: the park-risk detail layout keeps its fixed 280px side track."],
  ["src/app/admin/reports/ReportsClientParts.tsx:110:1:[112px]", "A5 skeleton/panel geometry: the report preview tile preserves its 112px base height and is not shell spacing."],
  ["src/app/admin/reports/ReportsClientParts.tsx:110:2:[112px]", "A5 skeleton/panel geometry: the report preview tile preserves its 112px medium height and is not shell spacing."],
  ["src/app/admin/reports/ReportsClientParts.tsx:110:3:[112px]", "A5 skeleton/panel geometry: the report preview tile preserves its 112px medium width and is not shell spacing."],
  ["src/app/admin/reports/ReportsClientParts.tsx:111:1:[256px]", "A5 skeleton/panel geometry: the reports empty state keeps its 256px minimum height."],
  ["src/app/admin/reports/ReportsClientParts.tsx:565:1:[340px]", "A5 skeleton/panel geometry: the reports action panel keeps its 340px large-screen minimum width."],
  ["src/app/admin/reports/ReportsClientParts.tsx:658:1:[112px_minmax(0,1fr)]", "A6 grid track geometry: the report row preserves its 112px media track."],
  ["src/app/[locale]/(streamed)/auth/page.tsx:79:1:[minmax(0,1fr)_440px]", "A6 grid track geometry: the auth layout preserves its fixed 440px form track."],
  ["src/app/[locale]/(streamed)/help/page.tsx:62:1:[minmax(0,1fr)_390px]", "A6 grid track geometry: the help layout preserves its fixed 390px support track."],
  ["src/app/[locale]/(streamed)/page.tsx:43:1:[560px]", "A5 skeleton/panel geometry: the home hero keeps its 560px large-screen minimum height."],
  ["src/app/profile/ProfileWorkspaceView.tsx:111:1:[96px]", "A1 shell-top historical variant: 值保真保留的历史不一致；候选未来 shell-top 对齐批统一后移除。"],
  ["src/app/profile/ProfileWorkspaceView.tsx:111:2:[64px]", "A5 skeleton/panel geometry: the profile workspace preserves its 64px bottom breathing room."],
  ["src/app/profile/ProfileWorkspaceView.tsx:112:1:[80px]", "A4 avatar geometry: the profile owner avatar keeps its dedicated 80px height."],
  ["src/app/profile/ProfileWorkspaceView.tsx:112:2:[80px]", "A4 avatar geometry: the profile owner avatar keeps its dedicated 80px width."],
  ["src/app/profile/ProfileWorkspaceView.tsx:113:1:[10px]", "A5 skeleton/panel geometry: the profile field preserves its one-off 10px vertical padding."],
  ["src/app/profile/ProfileWorkspaceView.tsx:117:1:[56px]", "A4 avatar geometry: the pet avatar keeps its dedicated 56px height."],
  ["src/app/profile/ProfileWorkspaceView.tsx:117:2:[56px]", "A4 avatar geometry: the pet avatar keeps its dedicated 56px width."],
  ["src/app/[locale]/(streamed)/store/admin/page.tsx:482:1:[minmax(0,1.25fr)_minmax(320px,0.75fr)]", "A6 grid track geometry: the store-admin editor preserves its 320px secondary-track floor."],
  ["src/app/[locale]/(streamed)/store/admin/page.tsx:616:1:[520px]", "A5 skeleton/panel geometry: the store-admin scroll panel preserves its 520px maximum height."],
  ["src/app/[locale]/(streamed)/store/checkout/page.tsx:44:1:[192px]", "A5 skeleton/panel geometry: the checkout cart list preserves its 192px maximum height."],
  ["src/app/[locale]/(streamed)/store/checkout/page.tsx:45:1:[80px]", "A5 skeleton/panel geometry: the checkout shell preserves its 80px bottom clearance."],
  ["src/app/[locale]/(streamed)/store/page.tsx:65:1:[128px]", "A1 shell-top historical variant: 值保真保留的历史不一致；候选未来 shell-top 对齐批统一后移除。"],
  ["src/app/[locale]/(streamed)/store/page.tsx:67:1:[28px]", "A2 control/icon geometry: the store quantity control keeps its dedicated 28px height."],
  ["src/app/[locale]/(streamed)/store/page.tsx:67:2:[28px]", "A2 control/icon geometry: the store quantity control keeps its dedicated 28px width."],
  ["src/app/[locale]/(streamed)/store/page.tsx:68:1:[28px]", "A2 control/icon geometry: the store quantity label keeps its dedicated 28px width."],
  ["src/app/[locale]/(streamed)/store/page.tsx:70:1:[64px]", "A3 floating-cart geometry: the mobile cart trigger keeps its dedicated 64px height."],
  ["src/app/[locale]/(streamed)/store/page.tsx:70:2:[64px]", "A3 floating-cart geometry: the mobile cart trigger keeps its dedicated 64px width."],
  ["src/app/[locale]/(streamed)/store/page.tsx:71:1:[112px]", "A3 floating-cart geometry: the toast keeps 112px bottom clearance; the numeric match with shell-top is coincidental and semantically unrelated."],
  ["src/app/[locale]/(streamed)/store/page.tsx:724:1:[minmax(0,1fr)_minmax(360px,0.72fr)]", "A6 grid track geometry: the store content/cart split preserves its 360px secondary-track floor."],
  ["src/app/user/[id]/UserPageClient.tsx:75:1:[1fr_280px]", "A6 grid track geometry: the user profile layout preserves its fixed 280px side track."],
  ["src/components/ChatBottomSheet.tsx:562:1:[5px]", "A7 component one-off geometry: the chat-sheet drag handle keeps its dedicated 5px height."],
  ["src/components/ChatBottomSheet.tsx:618:1:[260px]", "A7 component one-off geometry: the chat attachment bubble keeps its local 260px maximum width."],
  ["src/components/ChatBottomSheet.tsx:622:1:[320px]", "A7 component one-off geometry: the chat message bubble keeps its local 320px maximum width."],
  ["src/components/GlobeFullPage.tsx:684:1:[min(320px,calc(100vw-2rem))]", "A7 component one-off geometry: the globe overlay keeps its viewport-bounded 320px width expression."],
  ["src/components/GlobeTutorial.tsx:183:1:[340px]", "A7 component one-off geometry: the globe tutorial callout keeps its local 340px width."],
  ["src/components/HomeClientParts.tsx:308:1:[680px]", "A7 component one-off geometry: the home hero copy keeps its local 680px maximum width."],
  ["src/components/HomeClientParts.tsx:598:1:[48px_1fr]", "A6 grid track geometry: each home feature row preserves its 48px icon track."],
  ["src/components/HomeClientParts.tsx:613:1:[430px]", "A7 component one-off geometry: the globe hero showcase keeps its 430px base minimum height for layout stability; this value must not change."],
  ["src/components/HomeClientParts.tsx:613:2:[540px]", "A7 component one-off geometry: the globe hero showcase keeps its 540px small-screen minimum height for layout stability; this value must not change."],
  ["src/components/HomeClientParts.tsx:625:1:[135px]", "A7 component one-off geometry: the showcase phone card keeps its local 135px small-screen width."],
  ["src/components/HomeClientParts.tsx:625:2:[158px]", "A7 component one-off geometry: the showcase phone card keeps its local 158px large-screen width."],
  ["src/components/ui/Badge.tsx:44:1:[38px]", "A7 component one-off geometry: the badge keeps its dedicated 38px minimum tap-target height."],
];

const allowlist = new Map(allowlistEntries);
const arbitraryPxPattern = /\[[^\]]*\d(?:\.\d+)?px[^\]]*\]/g;

async function discoverSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await discoverSourceFiles(absolutePath));
    } else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files.sort();
}

const targets = await discoverSourceFiles(sourceRoot);
const observed = new Map();

for (const absolutePath of targets) {
  const file = path.relative(repoRoot, absolutePath).split(path.sep).join("/");
  const source = await readFile(absolutePath, "utf8");
  source.split(/\r?\n/).forEach((line, index) => {
    arbitraryPxPattern.lastIndex = 0;
    let match;
    let occurrence = 0;
    while ((match = arbitraryPxPattern.exec(line)) !== null) {
      occurrence += 1;
      const key = `${file}:${index + 1}:${occurrence}:${match[0]}`;
      observed.set(key, line.trim());
    }
  });
}

const failures = [];
if (allowlistEntries.length !== 50 || allowlist.size !== 50) {
  failures.push(`Allowlist must contain exactly 50 unique entries; received ${allowlistEntries.length} entries / ${allowlist.size} unique keys.`);
}
for (const [key, line] of observed) {
  if (!allowlist.has(key)) failures.push(`Unexpected component arbitrary px ${key}: ${line}`);
}
for (const [key, reason] of allowlist) {
  if (!observed.has(key)) failures.push(`Stale allowlist entry ${key}: ${reason}`);
  if (!String(reason).trim()) failures.push(`Allowlist entry ${key} has no reason.`);
}

if (failures.length > 0) {
  console.error("Component arbitrary px contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Component arbitrary px contract check passed.");
console.log(`Dynamically scanned ${targets.length} src TypeScript files.`);
console.log(`Observed ${observed.size} arbitrary px hits; exact allowlist size ${allowlist.size}.`);
console.log("Allowlist stale-entry and non-empty-reason assertions passed.");
