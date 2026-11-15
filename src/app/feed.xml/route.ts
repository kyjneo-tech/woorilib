import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = false;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  // ISO(YYYY-MM-DD) → RSS pubDate. 한국 시간 오전 9시 발행 기준.
  const date = new Date(`${iso}T09:00:00+09:00`);
  return date.toUTCString();
}

export function GET() {
  const posts = getAllPosts();
  const updated = posts[0]?.updated ?? "2026-11-15";
  const url = SITE.url;

  const items = posts
    .map((post) => {
      const link = `${url}/posts/${post.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <pubDate>${rfc822(post.date)}</pubDate>`,
        `      <category>${escapeXml(post.category.label)}</category>`,
        `      <description>${escapeXml(post.description)}</description>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(SITE.name)}</title>`,
    `    <link>${url}/</link>`,
    `    <description>${escapeXml(SITE.description)}</description>`,
    "    <language>ko-KR</language>",
    `    <lastBuildDate>${rfc822(updated)}</lastBuildDate>`,
    `    <atom:link href="${url}/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
