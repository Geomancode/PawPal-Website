import { readFile } from "node:fs/promises";

const PUBLIC_SITE = "https://www.pawpal.be";
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const MAX_IMAGE_BYTES = 300 * 1024;
const REQUIRED_IMAGE_WIDTH = 1200;
const REQUIRED_IMAGE_HEIGHT = 630;

const baseUrl = new URL(process.argv[2] ?? process.env.OG_BASE_URL ?? DEFAULT_BASE_URL);

const publicRoutes = [
  {
    path: "/",
    title: "Pet Safety Map, Smart Tags, and Local Pet Community | PawPal",
    description:
      "PawPal combines fog-of-war walks, NFC pet safety profiles, AI care guidance, and trusted local pet help from Belgium outward.",
  },
  {
    path: "/globe",
    title: "Live Pet Globe | PawPal",
    description:
      "Explore PawPal's interactive map for nearby pet places, community missions, weather, and local pet help around Ghent and beyond.",
  },
  {
    path: "/store",
    title: "Store | PawPal",
    description:
      "Shop PawPal NFC safety tags and curated pet gear for smarter walks, faster owner contact, and daily care.",
  },
  {
    path: "/about",
    title: "About | PawPal",
    description:
      "Meet the PawPal team in Ghent and learn how the app, website, and NFC smart tags connect daily walks, safety, and local pet care.",
  },
  {
    path: "/help",
    title: "Help Center | PawPal",
    description:
      "Get PawPal support for NFC tags, public pet profiles, accounts, community features, and safety workflows.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | PawPal",
    description:
      "Learn how PawPal handles account, pet profile, location, store, and community data with controlled sharing and privacy-first public safety pages.",
  },
  {
    path: "/terms",
    title: "Terms of Service | PawPal",
    description:
      "Review PawPal terms for the website, store, public pet safety flows, community features, and app-connected experiences.",
  },
  {
    path: "/guidelines",
    title: "Community Guidelines | PawPal",
    description:
      "Read PawPal community guidelines for respectful conduct, prohibited content, location privacy, reports, moderation, and appeals.",
  },
];

const dynamicTemplates = [
  { route: "/post/[id]", file: "src/app/post/[id]/page.tsx" },
  { route: "/group/[id]", file: "src/app/group/[id]/page.tsx" },
  { route: "/user/[id]", file: "src/app/user/[id]/page.tsx" },
  { route: "/tag/[id]", file: "src/app/tag/[id]/page.tsx" },
];

const checks = [];

function expect(condition, message) {
  checks.push({ ok: Boolean(condition), message });
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function parseAttributes(tag) {
  const attrs = {};
  const attrPattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/g;
  let match;
  while ((match = attrPattern.exec(tag)) !== null) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3]);
  }
  return attrs;
}

function parseMetadata(html) {
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => parseAttributes(match[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => parseAttributes(match[0]));

  return {
    title,
    meta(name) {
      return metas.find((entry) => entry.name === name)?.content ?? "";
    },
    property(property) {
      return metas.find((entry) => entry.property === property)?.content ?? "";
    },
    link(rel) {
      return links.find((entry) => entry.rel === rel)?.href ?? "";
    },
  };
}

function localFetchUrl(url) {
  const parsed = new URL(url, baseUrl);
  if (parsed.hostname === "www.pawpal.be" || parsed.hostname === "pawpal.be") {
    return new URL(`${parsed.pathname}${parsed.search}`, baseUrl);
  }
  return parsed;
}

function imageDimensions(buffer) {
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      type: "png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      offset += 2;

      if (marker === 0xd9 || marker === 0xda) break;
      const length = buffer.readUInt16BE(offset);
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isStartOfFrame) {
        return {
          type: "jpeg",
          height: buffer.readUInt16BE(offset + 3),
          width: buffer.readUInt16BE(offset + 5),
        };
      }

      offset += length;
    }
  }

  throw new Error("Unsupported image format for dimension check.");
}

async function fetchText(path) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
    },
  });
  expect(response.ok, `${path} returns HTTP 2xx (${response.status}).`);
  return response.text();
}

async function verifyRoute(route) {
  const html = await fetchText(route.path);
  const metadata = parseMetadata(html);
  const canonical = `${PUBLIC_SITE}${route.path === "/" ? "" : route.path}`;
  const ogImage = metadata.property("og:image");
  const twitterImage = metadata.meta("twitter:image");

  expect(metadata.title === route.title, `${route.path} has page-specific <title>.`);
  expect(metadata.meta("description") === route.description, `${route.path} has page-specific meta description.`);
  expect(metadata.link("canonical") === canonical, `${route.path} has canonical ${canonical}.`);
  expect(metadata.property("og:title") === route.title, `${route.path} has page-specific og:title.`);
  expect(metadata.property("og:description") === route.description, `${route.path} has page-specific og:description.`);
  expect(metadata.property("og:url") === canonical, `${route.path} has og:url ${canonical}.`);
  expect(metadata.property("og:type") === "website", `${route.path} has og:type website.`);
  expect(Boolean(ogImage), `${route.path} has og:image.`);
  expect(metadata.meta("twitter:card") === "summary_large_image", `${route.path} has summary_large_image Twitter card.`);
  expect(metadata.meta("twitter:title") === route.title, `${route.path} has page-specific twitter:title.`);
  expect(metadata.meta("twitter:description") === route.description, `${route.path} has page-specific twitter:description.`);
  expect(Boolean(twitterImage), `${route.path} has twitter:image.`);
  expect(ogImage === twitterImage, `${route.path} uses the same safe image for OG and Twitter.`);

  if (ogImage) {
    const imageUrl = localFetchUrl(ogImage);
    const imageResponse = await fetch(imageUrl);
    expect(imageResponse.ok, `${route.path} og:image is fetchable from local server (${imageResponse.status}).`);
    const contentType = imageResponse.headers.get("content-type") ?? "";
    expect(contentType.startsWith("image/"), `${route.path} og:image content-type is image/* (${contentType}).`);

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    const dimensions = imageDimensions(bytes);
    expect(bytes.byteLength <= MAX_IMAGE_BYTES, `${route.path} og:image is <=300KB (${bytes.byteLength} bytes).`);
    expect(
      dimensions.width === REQUIRED_IMAGE_WIDTH && dimensions.height === REQUIRED_IMAGE_HEIGHT,
      `${route.path} og:image is 1200x630 (${dimensions.width}x${dimensions.height}).`,
    );
  }
}

async function verifyNoDuplicateTitles() {
  const titles = new Map();
  for (const route of publicRoutes) {
    if (titles.has(route.title)) {
      expect(false, `${route.path} title duplicates ${titles.get(route.title)}.`);
    } else {
      titles.set(route.title, route.path);
      expect(true, `${route.path} title is unique across public routes.`);
    }
  }
}

async function verifyDynamicTemplates() {
  for (const template of dynamicTemplates) {
    const source = await readFile(new URL(`../${template.file}`, import.meta.url), "utf8");
    expect(source.includes("publicPageMetadata"), `${template.route} uses shared publicPageMetadata helper.`);
    expect(!source.includes("openGraph:"), `${template.route} does not hand-roll OpenGraph images.`);
    expect(!source.includes("avatar_url ? [{ url"), `${template.route} does not expose user avatars as og:image.`);
  }

  const petAlias = await readFile(new URL("../src/app/pet/[id]/page.tsx", import.meta.url), "utf8");
  expect(petAlias.includes("redirect(`/tag/${id}`)"), "/pet/[id] redirects to the audited /tag/[id] template.");
}

console.log(`OG contract target: ${baseUrl.toString()}`);

for (const route of publicRoutes) {
  await verifyRoute(route);
}

await verifyNoDuplicateTitles();
await verifyDynamicTemplates();

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.message}`);
}

console.log(`OG contract summary: ${checks.length - failed.length}/${checks.length} checks passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
