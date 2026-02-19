import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

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
const BLOG_DESCRIPTION =
  "You'll learn about what I'm working on, how I work, and probably some cool stuff to do with maths in game dev.";

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

const htmlEscape = (text = "") =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

const humanDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
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
    const url = `${SITE_URL}/blog/${encodeURIComponent(slug)}/`;
    const html = marked.parse(body);
    return { title, summary, date, slug, url, html };
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
    `    <description>${xmlEscape(BLOG_DESCRIPTION)}</description>`,
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

const buildPostPageHtml = (post) => {
  const pageTitle = `${post.title} | Wayfarer Games Blog`;
  const description = post.summary || BLOG_DESCRIPTION;
  const articleDate = post.date ? humanDate(post.date) : "";
  const publishedISO = post.date ? new Date(post.date).toISOString() : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlEscape(pageTitle)}</title>
  <meta name="description" content="${htmlEscape(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${htmlEscape(post.url)}">
  <link rel="alternate" type="application/rss+xml" title="Wayfarer Games Blog RSS" href="${htmlEscape(`${SITE_URL}/blog/rss.xml`)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Wayfarer Games">
  <meta property="og:title" content="${htmlEscape(pageTitle)}">
  <meta property="og:description" content="${htmlEscape(description)}">
  <meta property="og:url" content="${htmlEscape(post.url)}">
  <meta property="og:image" content="${htmlEscape(`${SITE_URL}/logo.png`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlEscape(pageTitle)}">
  <meta name="twitter:description" content="${htmlEscape(description)}">
  <meta name="twitter:image" content="${htmlEscape(`${SITE_URL}/logo.png`)}">
  <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      datePublished: publishedISO || undefined,
      dateModified: publishedISO || undefined,
      mainEntityOfPage: post.url,
      url: post.url,
      author: {
        "@type": "Person",
        name: "Dom Harris",
      },
      publisher: {
        "@type": "Organization",
        name: "Wayfarer Games",
        url: `${SITE_URL}/`,
      },
    })}
  </script>
  <style>
    :root { --bg:#141226; --poly:#5AD6FF; --lime:#FF8A66; --lav:#B693FF; --white:#FAFCFF; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:var(--bg); color:var(--white); font-family:"Nunito",sans-serif; }
    .wrap { max-width:900px; margin:0 auto; padding:30px 20px 80px; }
    .top-nav { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; gap:10px; flex-wrap:wrap; }
    .brand { color:var(--white); text-decoration:none; font-family:"Fredoka",sans-serif; font-weight:700; letter-spacing:.3px; }
    .pill { display:inline-flex; align-items:center; font-family:"Fredoka",sans-serif; font-weight:600; font-size:13px; line-height:1; text-decoration:none; padding:9px 16px; border-radius:999px; transition:.2s; }
    .pill-lime { background:var(--lime); color:var(--bg); }
    .pill-out { background:transparent; color:var(--white); border:2px solid rgba(255,255,255,.25); }
    .kicker { font-family:"Fredoka",sans-serif; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--poly); margin-bottom:10px; }
    h1 { font-family:"Fredoka",sans-serif; font-size:clamp(34px,6vw,56px); line-height:1.1; margin-bottom:10px; }
    .meta { font-size:13px; color:rgba(250,252,255,.6); margin-bottom:26px; border-bottom:1px solid rgba(255,255,255,.12); padding-bottom:20px; }
    .post-body { line-height:1.85; font-size:17px; color:rgba(250,252,255,.84); }
    .post-body h1, .post-body h2, .post-body h3, .post-body h4 { font-family:"Fredoka",sans-serif; color:var(--white); margin:1.8em 0 .55em; line-height:1.2; }
    .post-body h2 { font-size:1.7em; }
    .post-body h3 { color:var(--poly); }
    .post-body p { margin-bottom:1.15em; }
    .post-body a { color:var(--poly); text-underline-offset:3px; text-decoration-color:rgba(90,214,255,.4); }
    .post-body ul, .post-body ol { padding-left:1.6em; margin-bottom:1.15em; }
    .post-body pre { background:rgba(0,0,0,.38); border:1.5px solid rgba(255,255,255,.08); border-radius:12px; padding:20px 22px; overflow-x:auto; margin:1.5em 0; }
    .post-body code { background:rgba(90,214,255,.1); color:var(--poly); padding:2px 7px; border-radius:5px; font-size:.87em; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .post-body pre code { background:none; padding:0; color:rgba(250,252,255,.88); }
    .post-body blockquote { border-left:3px solid var(--poly); padding:6px 0 6px 20px; margin:1.5em 0; color:rgba(250,252,255,.6); font-style:italic; background:rgba(90,214,255,.04); border-radius:0 8px 8px 0; }
    .post-body video { width:100%; border-radius:12px; border:1.5px solid rgba(255,255,255,.12); background:rgba(0,0,0,.4); margin:1.1em 0 1.4em; }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <main class="wrap">
    <nav class="top-nav">
      <a href="/" class="brand">Wayfarer Games</a>
      <div style="display:flex; gap:8px;">
        <a href="/blog/" class="pill pill-out">All posts</a>
        <a href="/blog/rss.xml" class="pill pill-lime">RSS</a>
      </div>
    </nav>
    <article>
      <div class="kicker">Wayfarer Devlog</div>
      <h1>${htmlEscape(post.title)}</h1>
      <div class="meta">${htmlEscape(articleDate)}</div>
      <div class="post-body">${post.html}</div>
    </article>
  </main>
</body>
</html>
`;
};

const writePostPages = (posts) => {
  for (const post of posts) {
    const postDir = path.join(blogDir, post.slug);
    mkdirSync(postDir, { recursive: true });
    const outputPath = path.join(postDir, "index.html");
    writeFileSync(outputPath, buildPostPageHtml(post), "utf8");
    console.log(`Generated ${path.relative(rootDir, outputPath)}`);
  }
};

const main = () => {
  mkdirSync(blogDir, { recursive: true });
  const posts = readPosts();
  writeFileSync(rssOutputPath, buildRssXml(posts), "utf8");
  writeFileSync(robotsOutputPath, buildRobotsTxt(), "utf8");
  writeFileSync(sitemapOutputPath, buildSitemapXml(posts), "utf8");
  writePostPages(posts);
  console.log(`Generated ${path.relative(rootDir, rssOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, robotsOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, sitemapOutputPath)}`);
};

main();
