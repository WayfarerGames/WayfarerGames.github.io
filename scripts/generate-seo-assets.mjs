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

const injectHundredDaysSeo = () => {
  let html = readFileSync(hundredDaysPath, "utf8");
  let posts;
  try {
    posts = JSON.parse(readFileSync(roadToReleasePath, "utf8"));
  } catch (err) {
    console.warn("Could not read road-to-release.json:", err?.message);
    return;
  }
  if (!Array.isArray(posts)) posts = [];
  const sorted = [...posts].sort(
    (a, b) => new Date(a.pubDate || 0) - new Date(b.pubDate || 0)
  );
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
  const articles = sorted
    .map((post) => {
      const title = (post.title || "Untitled").replace(/^day\s*\d+\s*[:\-–—]\s*/i, "") || post.title || "Untitled";
      const safeContent = escapeScriptInHtml(post.content || "");
      return `<article class="seo-100-days-entry"><h2>${htmlEscape(title)}</h2><time datetime="${htmlEscape(post.pubDate || "")}">${htmlEscape(humanDate(post.pubDate))}</time><div class="post-body">${safeContent}</div></article>`;
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
  console.log(`Injected SEO content for ${sorted.length} 100-days posts into ${path.relative(rootDir, hundredDaysPath)}`);
};

const main = () => {
  mkdirSync(blogDir, { recursive: true });
  const posts = readPosts();
  writeFileSync(rssOutputPath, buildRssXml(posts), "utf8");
  writeFileSync(robotsOutputPath, buildRobotsTxt(), "utf8");
  writeFileSync(sitemapOutputPath, buildSitemapXml(posts), "utf8");
  injectBlogIndexSeo(posts);
  writePostPages(posts);
  injectHundredDaysSeo();
  console.log(`Generated ${path.relative(rootDir, rssOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, robotsOutputPath)}`);
  console.log(`Generated ${path.relative(rootDir, sitemapOutputPath)}`);
};

main();
