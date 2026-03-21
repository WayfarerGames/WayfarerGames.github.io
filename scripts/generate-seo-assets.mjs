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
const blogIndexPath = path.join(blogDir, "index.html");
const hundredDaysPath = path.join(publicDir, "100-days-blog", "index.html");
const roadToReleasePath = path.join(publicDir, "road-to-release.json");
const roadToReleaseDir = path.join(publicDir, "road-to-release");
const homeRedirectPath = path.join(publicDir, "home", "index.html");
const roadToReleaseIndexPath = path.join(roadToReleaseDir, "index.html");
const BLOG_DESCRIPTION =
  "You'll learn about what I'm working on, how I work, and probably some cool stuff to do with maths in game dev.";
const ROAD_TO_RELEASE_DESCRIPTION =
  "A day-by-day development archive covering Polyfury's final stretch from prototype to launch.";
const siteHost = new URL(SITE_URL).hostname;

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
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const stripHtml = (text = "") =>
  String(text)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

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

const toAbsoluteUrl = (value = "") => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
  return `${SITE_URL}${normalized}`;
};

const numberToWords = (value) => {
  const underTwenty = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`numberToWords only supports integers from 0 to 100. Received: ${value}`);
  }

  if (value < 20) return underTwenty[value];
  if (value === 100) return "one-hundred";
  const tensPart = tens[Math.floor(value / 10)];
  const onesPart = value % 10;
  return onesPart ? `${tensPart}-${underTwenty[onesPart]}` : tensPart;
};

const normalizeRoadContent = (html = "") =>
  String(html)
    .replace(
      /https?:\/\/wayfarer(?:-games)?\.games\/road-to-release\/(day-[a-z0-9-]+)\/?(?:\?format=amp)?/gi,
      `${SITE_URL}/road-to-release/$1/`
    )
    .replace(
      /https?:\/\/wayfarer-games\.com\/road-to-release\/(day-[a-z0-9-]+)\/?(?:\?format=amp)?/gi,
      `${SITE_URL}/road-to-release/$1/`
    )
    .replace(/<script\b[\s\S]*?<\/script>/gi, "");

const parseHtmlAttributes = (raw = "") => {
  const attributes = {};
  const attributePattern = /([^\s=]+)(?:=(["'])(.*?)\2)?/g;
  let match;
  while ((match = attributePattern.exec(raw))) {
    const [, key, , value = ""] = match;
    attributes[key.toLowerCase()] = value;
  }
  return attributes;
};

const extractPreviewMedia = (html = "") => {
  const mediaPattern = /<img\b([^>]*?)>|<video\b([^>]*)>([\s\S]*?)<\/video>/gi;
  let match;
  let lastMedia = null;

  while ((match = mediaPattern.exec(html))) {
    const [, imgAttrsRaw, videoAttrsRaw, videoInner = ""] = match;

    if (imgAttrsRaw !== undefined) {
      const imgAttrs = parseHtmlAttributes(imgAttrsRaw);
      if (!imgAttrs.src) continue;
      lastMedia = {
        type: "image",
        imageUrl: toAbsoluteUrl(imgAttrs.src),
      };
      continue;
    }

    const videoAttrs = parseHtmlAttributes(videoAttrsRaw);
    const posterUrl = videoAttrs.poster ? toAbsoluteUrl(videoAttrs.poster) : "";
    const sources = [...videoInner.matchAll(/<source\b([^>]*?)>/gi)]
      .map((sourceMatch) => parseHtmlAttributes(sourceMatch[1]))
      .filter((attrs) => attrs.src);
    const preferredSource = sources[0];

    if (!preferredSource && !posterUrl) continue;

    lastMedia = {
      type: "video",
      imageUrl: posterUrl,
      videoUrl: preferredSource ? toAbsoluteUrl(preferredSource.src) : "",
      videoType: preferredSource?.type || "",
    };
  }

  return {
    imageUrl: lastMedia?.imageUrl || "",
    videoUrl: lastMedia?.type === "video" ? lastMedia.videoUrl || "" : "",
    videoType: lastMedia?.type === "video" ? lastMedia.videoType || "" : "",
  };
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
    const previewMedia = extractPreviewMedia(html);
    return { title, summary, date, slug, url, html, ...previewMedia };
  });

  posts.sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    if (aDate !== bDate) return bDate - aDate;
    return a.title.localeCompare(b.title);
  });
  return posts;
};

const readRoadToReleasePosts = () => {
  let payload;
  try {
    payload = JSON.parse(readFileSync(roadToReleasePath, "utf8"));
  } catch (error) {
    console.warn("Could not parse road-to-release.json:", error?.message);
    return [];
  }

  if (!Array.isArray(payload)) return [];

  const sorted = [...payload].sort((a, b) => new Date(a.pubDate || 0) - new Date(b.pubDate || 0));

  return sorted.map((entry, index) => {
    const dayNumber = index + 1;
    const slug = `day-${numberToWords(dayNumber)}`;
    const url = `${SITE_URL}/road-to-release/${slug}/`;
    const content = normalizeRoadContent(entry.content || "");
    const title = entry.title || `Day ${dayNumber}`;
    const summary = stripHtml(content).slice(0, 280) || ROAD_TO_RELEASE_DESCRIPTION;
    const previewMedia = extractPreviewMedia(content);

    return {
      ...entry,
      dayNumber,
      slug,
      url,
      title,
      summary,
      content,
      ...previewMedia,
    };
  });
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
  [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Sitemap: ${SITE_URL}/bulletfury-documentation/sitemap.xml`,
    "",
  ].join("\n");

const buildSitemapXml = (posts, roadPosts) => {
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/blog/`,
    `${SITE_URL}/100-days-blog/`,
    `${SITE_URL}/timer-privacy-policy/`,
    `${SITE_URL}/bulletfury-documentation/`,
  ];
  const postUrls = posts.map((post) => post.url);
  const roadUrls = roadPosts.map((post) => post.url);
  const allUrls = [...new Set([...staticUrls, ...postUrls, ...roadUrls])];

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

const buildPostSchema = (post, description, publishedISO, previewImageUrl) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished: publishedISO || undefined,
    dateModified: publishedISO || undefined,
    mainEntityOfPage: post.url,
    url: post.url,
    image: previewImageUrl || undefined,
    author: {
      "@type": "Person",
      name: "Dom Harris",
    },
    publisher: {
      "@type": "Organization",
      name: "Wayfarer Games",
      url: `${SITE_URL}/`,
    },
  };

  if (post.videoUrl) {
    schema.video = {
      "@type": "VideoObject",
      contentUrl: post.videoUrl,
      thumbnailUrl: previewImageUrl,
    };
  }

  return schema;
};

const buildRoadPostSchema = (post, description, publishedISO, previewImageUrl) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    alternativeHeadline: `Day ${post.dayNumber}`,
    description,
    datePublished: publishedISO || undefined,
    dateModified: publishedISO || undefined,
    mainEntityOfPage: post.url,
    url: post.url,
    image: previewImageUrl || undefined,
    isPartOf: {
      "@type": "Blog",
      name: "100 Days of Dev",
      url: `${SITE_URL}/100-days-blog/`,
    },
    author: {
      "@type": "Person",
      name: "Dom Harris",
    },
    publisher: {
      "@type": "Organization",
      name: "Wayfarer Games",
      url: `${SITE_URL}/`,
    },
  };

  if (post.videoUrl) {
    schema.video = {
      "@type": "VideoObject",
      contentUrl: post.videoUrl,
      thumbnailUrl: previewImageUrl,
    };
  }

  return schema;
};

const buildRedirectPageHtml = ({ title, description, canonicalUrl, redirectUrl }) => {
  const safeTitle = htmlEscape(title);
  const safeDescription = htmlEscape(description);
  const safeCanonical = htmlEscape(canonicalUrl);
  const safeRedirect = htmlEscape(redirectUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${safeCanonical}">
  <meta http-equiv="refresh" content="0; url=${safeRedirect}">
  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
  <main>
    <p>This page has moved to <a href="${safeRedirect}">${safeRedirect}</a>.</p>
  </main>
</body>
</html>
`;
};

const buildRoadPostPageHtml = (post) => {
  const pageTitle = `Day ${post.dayNumber}: ${post.title} | Wayfarer Games`;
  const description = post.summary || ROAD_TO_RELEASE_DESCRIPTION;
  const publishedISO = post.pubDate ? new Date(post.pubDate).toISOString() : "";
  const previewImageUrl = post.imageUrl || `${SITE_URL}/logo.png`;
  const schema = buildRoadPostSchema(post, description, publishedISO, previewImageUrl);
  const safeContent = escapeScriptInHtml(post.content || "<p>No content available.</p>");
  const safeTitle = htmlEscape(post.title);
  const safeDescription = htmlEscape(description);
  const safeUrl = htmlEscape(post.url);
  const safeImage = htmlEscape(previewImageUrl);
  const safeDay = htmlEscape(`Day ${post.dayNumber}`);
  const safeDate = htmlEscape(humanDate(post.pubDate || ""));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlEscape(pageTitle)}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${safeUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Wayfarer Games">
  <meta property="og:title" content="${htmlEscape(pageTitle)}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:image" content="${safeImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlEscape(pageTitle)}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImage}">
  <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
  </script>
  <link rel="stylesheet" href="/styles/wayfarer-shared.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { min-height:100vh; background:radial-gradient(circle at top, rgba(90,214,255,.14), transparent 34%), linear-gradient(180deg, #0b0f1f 0%, #141227 100%); }
    .shell { max-width:960px; margin:0 auto; padding:28px 18px 72px; }
    .topbar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:32px; }
    .crumb, .pill-link { display:inline-flex; align-items:center; gap:8px; text-decoration:none; }
    .crumb { color:rgba(250,252,255,.72); font-size:14px; font-weight:700; }
    .pill-link { border:1px solid rgba(90,214,255,.22); border-radius:999px; padding:8px 14px; color:var(--poly); font-size:13px; font-weight:700; background:rgba(90,214,255,.08); }
    .card { background:rgba(14,12,28,.82); border:1px solid rgba(255,255,255,.09); border-radius:24px; box-shadow:0 24px 80px rgba(0,0,0,.35); overflow:hidden; }
    .hero { padding:34px clamp(20px, 4vw, 44px) 28px; border-bottom:1px solid rgba(255,255,255,.08); }
    .eyebrow { display:inline-block; margin-bottom:14px; font-family:"Fredoka", sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--poly); background:rgba(90,214,255,.12); border:1px solid rgba(90,214,255,.28); border-radius:999px; padding:7px 12px; }
    h1 { font-family:"Fredoka", sans-serif; font-size:clamp(32px, 5vw, 60px); line-height:1.04; margin-bottom:14px; }
    .summary { font-size:17px; line-height:1.7; color:rgba(250,252,255,.72); max-width:760px; }
    .meta { display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; color:rgba(250,252,255,.48); font-size:14px; font-weight:700; }
    .content { padding:30px clamp(20px, 4vw, 44px) 42px; line-height:1.88; font-size:17px; color:rgba(250,252,255,.84); }
    .content h1, .content h2, .content h3, .content h4 { font-family:"Fredoka", sans-serif; line-height:1.15; margin:1.7em 0 .55em; color:var(--white); }
    .content h2 { font-size:1.7em; }
    .content h3 { font-size:1.3em; color:var(--poly); }
    .content p { margin-bottom:1.15em; }
    .content a { color:var(--poly); text-decoration-color:rgba(90,214,255,.4); text-underline-offset:3px; }
    .content img, .content video, .content iframe { display:block; width:100%; max-width:100%; border-radius:16px; margin:1.2em 0 1.5em; border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.28); }
    .content ul, .content ol { padding-left:1.6em; margin-bottom:1.15em; }
    .content li { margin-bottom:.35em; }
    .content blockquote { border-left:3px solid var(--poly); padding:8px 0 8px 18px; margin:1.5em 0; color:rgba(250,252,255,.62); background:rgba(90,214,255,.05); border-radius:0 10px 10px 0; }
    .content code { background:rgba(90,214,255,.08); color:var(--poly); padding:2px 6px; border-radius:6px; font-size:.9em; }
    .content pre { overflow:auto; padding:18px 20px; border-radius:14px; background:rgba(0,0,0,.28); border:1px solid rgba(255,255,255,.08); margin:1.4em 0; }
    .content pre code { padding:0; background:none; }
    .footer-nav { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:0 clamp(20px, 4vw, 44px) 30px; }
    @media (max-width: 720px) {
      .shell { padding:18px 12px 48px; }
      .hero, .content { padding-left:18px; padding-right:18px; }
      .footer-nav { padding-left:18px; padding-right:18px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <nav class="topbar" aria-label="Breadcrumb">
      <a href="/" class="crumb">Wayfarer Games</a>
      <a href="/100-days-blog/" class="pill-link">100 Days Archive</a>
      <a href="/road-to-release/" class="pill-link">Legacy Links</a>
    </nav>
    <article class="card">
      <header class="hero">
        <div class="eyebrow">${safeDay}</div>
        <h1>${safeTitle}</h1>
        <p class="summary">${safeDescription}</p>
        <div class="meta">
          <span>${safeDate}</span>
          <span>Polyfury development log</span>
        </div>
      </header>
      <div class="content">${safeContent}</div>
      <nav class="footer-nav" aria-label="Page links">
        <a href="/100-days-blog/" class="pill-link">Browse the full archive</a>
        <a href="${safeUrl}" class="pill-link">Canonical URL</a>
      </nav>
    </article>
  </main>
</body>
</html>
`;
};

const replaceOne = (html, pattern, replacement) => {
  if (!pattern.test(html)) {
    throw new Error(`Could not find pattern: ${pattern}`);
  }
  return html.replace(pattern, replacement);
};

const buildPostPageHtml = (post) => {
  const pageTitle = `${post.title} | Wayfarer Games Blog`;
  const description = post.summary || BLOG_DESCRIPTION;
  const publishedISO = post.date ? new Date(post.date).toISOString() : "";
  const previewImageUrl = post.imageUrl || `${SITE_URL}/logo.png`;
  const schema = buildPostSchema(post, description, publishedISO, previewImageUrl);
  let html = readFileSync(blogIndexPath, "utf8");

  html = replaceOne(html, /<title>[\s\S]*?<\/title>/, `<title>${htmlEscape(pageTitle)}</title>`);
  html = replaceOne(
    html,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${htmlEscape(description)}">`
  );
  html = replaceOne(
    html,
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${htmlEscape(post.url)}">`
  );
  html = replaceOne(
    html,
    /<meta property="og:type" content="[^"]*">/,
    '<meta property="og:type" content="article">'
  );
  html = replaceOne(
    html,
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${htmlEscape(pageTitle)}">`
  );
  html = replaceOne(
    html,
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${htmlEscape(description)}">`
  );
  html = replaceOne(
    html,
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${htmlEscape(post.url)}">`
  );
  html = replaceOne(
    html,
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${htmlEscape(previewImageUrl)}">`
  );
  html = replaceOne(
    html,
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${htmlEscape(pageTitle)}">`
  );
  html = replaceOne(
    html,
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${htmlEscape(description)}">`
  );
  html = replaceOne(
    html,
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${htmlEscape(previewImageUrl)}">`
  );
  html = replaceOne(
    html,
    /<script type="application\/ld\+json" id="blogSchema">[\s\S]*?<\/script>/,
    `  <script type="application/ld+json" id="blogSchema">\n    ${JSON.stringify(schema, null, 2)}\n  </script>`
  );

  html = html.replace(/\n\s*<meta property="og:video" content="[^"]*">/g, "");
  html = html.replace(/\n\s*<meta property="og:video:type" content="[^"]*">/g, "");

  if (post.videoUrl) {
    const videoMeta = [
      `  <meta property="og:video" content="${htmlEscape(post.videoUrl)}">`,
      post.videoType
        ? `  <meta property="og:video:type" content="${htmlEscape(post.videoType)}">`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    html = replaceOne(
      html,
      /<meta name="twitter:card" content="summary_large_image">/,
      `${videoMeta}\n  <meta name="twitter:card" content="summary_large_image">`
    );
  }

  return html;
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

const writeRedirectPages = () => {
  mkdirSync(path.dirname(homeRedirectPath), { recursive: true });
  writeFileSync(
    homeRedirectPath,
    buildRedirectPageHtml({
      title: "Wayfarer Games Home",
      description: "This legacy URL now points to the Wayfarer Games homepage.",
      canonicalUrl: `${SITE_URL}/`,
      redirectUrl: `${SITE_URL}/`,
    }),
    "utf8"
  );

  mkdirSync(path.dirname(roadToReleaseIndexPath), { recursive: true });
  writeFileSync(
    roadToReleaseIndexPath,
    buildRedirectPageHtml({
      title: "100 Days of Dev Archive",
      description: "The legacy Road to Release archive now lives at the 100 Days blog.",
      canonicalUrl: `${SITE_URL}/100-days-blog/`,
      redirectUrl: `${SITE_URL}/100-days-blog/`,
    }),
    "utf8"
  );
};

const writeRoadToReleasePages = (roadPosts) => {
  mkdirSync(roadToReleaseDir, { recursive: true });

  for (const post of roadPosts) {
    const postDir = path.join(roadToReleaseDir, post.slug);
    mkdirSync(postDir, { recursive: true });
    writeFileSync(path.join(postDir, "index.html"), buildRoadPostPageHtml(post), "utf8");
  }
};

const injectBlogIndexSeo = (posts) => {
  let html = readFileSync(blogIndexPath, "utf8");
  const links = posts
    .map(
      (post) =>
        `        <li><a href="${htmlEscape(post.url)}">${htmlEscape(post.title)}</a></li>`
    )
    .join("\n");
  const block = `<noscript><nav aria-label="All blog posts"><ul class="post-list">\n${links}\n      </ul></nav></noscript>`;
  if (html.includes("<!-- SEO_BLOG_LINKS -->")) {
    html = html.replace("<!-- SEO_BLOG_LINKS -->", block);
  } else {
    const existingBlock = /<noscript><nav aria-label="All blog posts"><ul class="post-list">[\s\S]*?<\/ul><\/nav><\/noscript>/;
    if (existingBlock.test(html)) {
      html = html.replace(existingBlock, block);
    } else {
      console.warn("Blog index has no SEO_BLOG_LINKS placeholder or existing block, skipping inject");
      return;
    }
  }
  writeFileSync(blogIndexPath, html, "utf8");
  console.log(`Injected SEO post links into ${path.relative(rootDir, blogIndexPath)}`);
};

const escapeScriptInHtml = (str) =>
  String(str).replace(/<\/script/gi, "</scr\u200bipt");

const injectHundredDaysSeo = (roadPosts) => {
  let html = readFileSync(hundredDaysPath, "utf8");
  const humanDate = (v) => {
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
  };
  const articles = roadPosts
    .map((post) => {
      const title =
        (post.title || "Untitled").replace(/^day\s*\d+\s*[:\-–—]\s*/i, "") || post.title || "Untitled";
      const safeContent = escapeScriptInHtml(post.content || "");
      return `<article class="seo-100-days-entry"><h2><a href="${htmlEscape(post.url)}">Day ${post.dayNumber}: ${htmlEscape(title)}</a></h2><time datetime="${htmlEscape(post.pubDate || "")}">${htmlEscape(humanDate(post.pubDate))}</time><div class="post-body">${safeContent}</div></article>`;
    })
    .join("\n");
  const block = `<div id="seo-100-days-content" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">${articles}</div>`;
  if (html.includes("<!-- SEO_100_DAYS_CONTENT -->")) {
    html = html.replace("<!-- SEO_100_DAYS_CONTENT -->", block);
  } else {
    const startMarker = '<div id="seo-100-days-content"';
    const bodyClose = "</body>";
    const startIdx = html.indexOf(startMarker);
    const bodyIdx = html.indexOf(bodyClose);
    if (startIdx !== -1 && bodyIdx > startIdx) {
      const beforeBody = html.slice(0, bodyIdx);
      const lastDivIdx = beforeBody.lastIndexOf("</div>");
      if (lastDivIdx > startIdx) {
        const afterClose = html.slice(lastDivIdx + "</div>".length);
        html = html.slice(0, startIdx) + block + afterClose;
      } else {
        console.warn("100-days index: could not find closing </div>, skipping inject");
        return;
      }
    } else {
      console.warn("100-days index has no SEO_100_DAYS_CONTENT placeholder or existing block, skipping inject");
      return;
    }
  }
  writeFileSync(hundredDaysPath, html, "utf8");
  console.log(`Injected SEO content for ${roadPosts.length} 100-days posts into ${path.relative(rootDir, hundredDaysPath)}`);
};

const main = () => {
  mkdirSync(blogDir, { recursive: true });
  const posts = readPosts();
  const roadPosts = readRoadToReleasePosts();
  writeFileSync(rssOutputPath, buildRssXml(posts), "utf8");
  writeFileSync(robotsOutputPath, buildRobotsTxt(), "utf8");
  writeFileSync(sitemapOutputPath, buildSitemapXml(posts, roadPosts), "utf8");
  injectBlogIndexSeo(posts);
  writePostPages(posts);
  writeRedirectPages();
  writeRoadToReleasePages(roadPosts);
  injectHundredDaysSeo(roadPosts);
  writeFileSync(path.join(rootDir, "CNAME"), `${siteHost}\n`, "utf8");
  console.log(`Generated ${path.relative(rootDir, rssOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, robotsOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, sitemapOutputPath)}`);
};

main();
