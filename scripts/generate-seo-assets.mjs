import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = (process.env.SITE_URL || "https://wayfarer-games.com").replace(/\/+$/, "");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const blogDir = path.join(publicDir, "blog");
const postsDir = path.join(blogDir, "posts");

const manifestPath = path.join(postsDir, "posts.json");
const rssOutputPath = path.join(blogDir, "rss.xml");
const robotsOutputPath = path.join(publicDir, "robots.txt");
const sitemapOutputPath = path.join(publicDir, "sitemap.xml");

const xmlEscape = (text = "") =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const normalizeManifest = (payload) => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((entry) => {
      if (typeof entry === "string") return { file: entry };
      if (entry && typeof entry.file === "string") return entry;
      return null;
    })
    .filter(Boolean);
};

const slugFromFileName = (fileName) =>
  fileName
    .replace(/\.(md|markdown|txt)$/i, "")
    .trim()
    .toLowerCase();

const parseFrontMatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: content };
  const raw = match[1];
  const meta = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) meta[key] = value;
  }
  return { meta, body: content.slice(match[0].length) };
};

const titleFromBody = (body, fallback) => {
  const h1 = body.match(/^#\s+(.+)$/m);
  const maybeTitle = h1?.[1] ? h1[1].trim() : fallback;
  return maybeTitle.replace(/\.(md|markdown|txt)$/i, "");
};

const stripMarkdown = (text) => {
  let output = String(text || "");
  output = output.replace(/```[\s\S]*?```/g, " ");
  output = output.replace(/`([^`]+)`/g, "$1");
  output = output.replace(/!\[[^\]]*]\([^)]+\)/g, " ");
  output = output.replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
  output = output.replace(/^#{1,6}\s+/gm, "");
  output = output.replace(/^[>\-\*\+]\s+/gm, "");
  output = output.replace(/\r?\n+/g, " ");
  output = output.replace(/\s+/g, " ").trim();
  return output;
};

const toPubDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toUTCString();
};

const readPosts = () => {
  const manifestRaw = readFileSync(manifestPath, "utf8");
  const manifest = normalizeManifest(JSON.parse(manifestRaw));
  const posts = manifest.map((entry) => {
    const filePath = path.join(postsDir, entry.file);
    const raw = readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const title = entry.title || meta.title || titleFromBody(body, entry.file);
    const summary = entry.summary || meta.summary || stripMarkdown(body).slice(0, 280);
    const date = entry.date || meta.date || "";
    const slug = slugFromFileName(entry.file);
    const url = `${SITE_URL}/blog/?post=${encodeURIComponent(slug)}`;
    return { title, summary, date, slug, url };
  });

  posts.sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    if (aDate !== bDate) return bDate - aDate;
    return a.title.localeCompare(b.title);
  });
  return posts;
};

const buildRssXml = (posts) => {
  const latestDate = posts.length ? toPubDate(posts[0].date) : new Date().toUTCString();
  const items = posts
    .map((post) => {
      const pubDate = toPubDate(post.date);
      return [
        "    <item>",
        `      <title>${xmlEscape(post.title)}</title>`,
        `      <link>${xmlEscape(post.url)}</link>`,
        `      <guid>${xmlEscape(post.url)}</guid>`,
        `      <description>${xmlEscape(post.summary)}</description>`,
        pubDate ? `      <pubDate>${xmlEscape(pubDate)}</pubDate>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>Wayfarer Games Blog</title>",
    "    <description>Devlogs and technical breakdowns from Wayfarer Games.</description>",
    `    <link>${xmlEscape(`${SITE_URL}/blog/`)}</link>`,
    `    <atom:link href="${xmlEscape(`${SITE_URL}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    "    <language>en-gb</language>",
    `    <lastBuildDate>${xmlEscape(latestDate)}</lastBuildDate>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};

const buildRobotsTxt = () =>
  ["User-agent: *", "Allow: /", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n");

const buildSitemapXml = (posts) => {
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/blog/`,
    `${SITE_URL}/blog/rss.xml`,
    `${SITE_URL}/100-days-blog/`,
    `${SITE_URL}/timer-privacy-policy/`,
  ];
  const postUrls = posts.map((post) => post.url);
  const allUrls = [...new Set([...staticUrls, ...postUrls])];

  const urlBlocks = allUrls
    .map((url) => {
      return ["  <url>", `    <loc>${xmlEscape(url)}</loc>`, "  </url>"].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlBlocks,
    "</urlset>",
    "",
  ].join("\n");
};

const main = () => {
  mkdirSync(blogDir, { recursive: true });
  const posts = readPosts();
  writeFileSync(rssOutputPath, buildRssXml(posts), "utf8");
  writeFileSync(robotsOutputPath, buildRobotsTxt(), "utf8");
  writeFileSync(sitemapOutputPath, buildSitemapXml(posts), "utf8");
  console.log(`Generated ${path.relative(rootDir, rssOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, robotsOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, sitemapOutputPath)}`);
};

main();
