import type { MetadataRoute } from "next";
import { CATEGORY_LIST } from "@/lib/categories";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const newestUpdate = posts.reduce(
    (latest, post) => (post.updated > latest ? post.updated : latest),
    "",
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE.url}/`,
      lastModified: newestUpdate ? new Date(`${newestUpdate}T09:00:00+09:00`) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...CATEGORY_LIST.map((category) => ({
      url: `${SITE.url}/category/${category.slug}`,
      lastModified: newestUpdate ? new Date(`${newestUpdate}T09:00:00+09:00`) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE.url}/about`,
      lastModified: new Date(`${newestUpdate || "2026-11-15"}T09:00:00+09:00`),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE.url}/privacy`,
      lastModified: new Date(`${newestUpdate || "2026-11-15"}T09:00:00+09:00`),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE.url}/posts/${post.slug}`,
    lastModified: new Date(`${post.updated}T09:00:00+09:00`),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticPages, ...postPages];
}
