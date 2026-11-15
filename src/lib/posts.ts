import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categoryOf, type Category, type CategorySlug } from "./categories";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

export type Post = {
  slug: string;
  title: string;
  description: string;
  /** ISO 날짜 (YYYY-MM-DD) */
  date: string;
  /** ISO 날짜 (YYYY-MM-DD) — 수정 이력이 없으면 date와 같다 */
  updated: string;
  category: Category;
  tags: string[];
  cover: string;
  coverAlt: string;
  content: string;
  /** 한국어 읽기 속도(분당 약 500자) 기준 예상 읽기 시간 */
  readingMinutes: number;
  charCount: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function requireString(
  data: Record<string, unknown>,
  key: string,
  file: string,
): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`[content/posts/${file}] frontmatter "${key}" 값이 비어 있습니다.`);
  }
  return value.trim();
}

function toTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

/** 본문 글자 수(공백 제외) — 읽기 시간 계산용 */
function countChars(markdown: string): number {
  return markdown.replace(/\s/g, "").length;
}

function parsePost(fileName: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const file = fileName;

  const slug =
    typeof data.slug === "string" && data.slug.trim() !== ""
      ? data.slug.trim()
      : fileName.replace(/\.md$/, "");

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(
      `[content/posts/${file}] slug는 영문 소문자·숫자·하이픈만 쓸 수 있습니다: "${slug}"`,
    );
  }

  const date = requireString(data, "date", file);
  if (!DATE_RE.test(date)) {
    throw new Error(`[content/posts/${file}] date 형식은 YYYY-MM-DD 입니다: "${date}"`);
  }

  const updatedRaw = typeof data.updated === "string" ? data.updated.trim() : "";
  const updated = updatedRaw || date;
  if (!DATE_RE.test(updated)) {
    throw new Error(`[content/posts/${file}] updated 형식은 YYYY-MM-DD 입니다: "${updated}"`);
  }

  const categorySlug = requireString(data, "category", file);
  const cover = requireString(data, "cover", file);
  if (!cover.startsWith("/images/")) {
    throw new Error(`[content/posts/${file}] cover 경로는 /images/ 로 시작해야 합니다: "${cover}"`);
  }
  if (!fs.existsSync(path.join(PUBLIC_DIR, cover))) {
    throw new Error(`[content/posts/${file}] cover 파일이 public/ 안에 없습니다: "${cover}"`);
  }

  const charCount = countChars(content);

  return {
    slug,
    title: requireString(data, "title", file),
    description: requireString(data, "description", file),
    date,
    updated,
    category: categoryOf(categorySlug),
    tags: toTags(data.tags),
    cover,
    coverAlt:
      typeof data.coverAlt === "string" && data.coverAlt.trim() !== ""
        ? data.coverAlt.trim()
        : requireString(data, "title", file),
    content,
    readingMinutes: Math.max(1, Math.round(charCount / 500)),
    charCount,
  };
}

let cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (cache) return cache;
  if (!fs.existsSync(POSTS_DIR)) return (cache = []);

  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(parsePost)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`slug가 중복됩니다: "${post.slug}"`);
    }
    seen.add(post.slug);
  }

  cache = posts;
  return posts;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function getPostsByCategory(slug: CategorySlug): Post[] {
  return getAllPosts().filter((post) => post.category.slug === slug);
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const others = getAllPosts().filter((item) => item.slug !== post.slug);
  const sameCategory = others.filter((item) => item.category.slug === post.category.slug);
  const sharedTags = others.filter(
    (item) =>
      !sameCategory.includes(item) && item.tags.some((tag) => post.tags.includes(tag)),
  );
  const rest = others.filter(
    (item) => !sameCategory.includes(item) && !sharedTags.includes(item),
  );
  return [...sameCategory, ...sharedTags, ...rest].slice(0, limit);
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ko"));
}

export function formatKoreanDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}
