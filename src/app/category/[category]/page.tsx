import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { CATEGORIES, CATEGORY_LIST, isCategorySlug } from "@/lib/categories";
import { getPostsByCategory, formatKoreanDate } from "@/lib/posts";
import { SITE } from "@/lib/site";

type PageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_LIST.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  if (!isCategorySlug(slug)) return { title: "카테고리를 찾을 수 없습니다" };
  const category = CATEGORIES[slug];

  return {
    title: `${category.label} — ${category.description.slice(0, 40)}`,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.label} | ${SITE.name}`,
      description: category.description,
      url: `${SITE.url}/category/${category.slug}`,
      locale: "ko_KR",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  if (!isCategorySlug(slug)) notFound();

  const category = CATEGORIES[slug];
  const posts = getPostsByCategory(slug);
  const [lead, ...rest] = posts;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: category.label,
        item: `${SITE.url}/category/${category.slug}`,
      },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.label} | ${SITE.name}`,
    description: category.description,
    url: `${SITE.url}/category/${category.slug}`,
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE.url}/posts/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="현재 위치" style={{ padding: 0 }}>
            <Link href="/">홈</Link>
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{category.label}</span>
          </nav>
          <h1 className="page-head__title">{category.title}</h1>
          <p className="page-head__desc">{category.description}</p>
          <p className="article__meta" style={{ borderBottom: 0, paddingBottom: 0 }}>
            <span>글 {posts.length}편</span>
            {posts[0] ? (
              <>
                <span aria-hidden="true">·</span>
                <span>최근 업데이트 {formatKoreanDate(posts[0].updated)}</span>
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {lead ? (
            posts.length === 1 ? (
              <PostCard post={lead} featured />
            ) : (
              <div className={posts.length === 2 ? "grid grid--2" : "grid grid--3"}>
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )
          ) : (
            <p style={{ color: "var(--muted)" }}>아직 이 주제에 등록된 글이 없습니다.</p>
          )}
          {rest.length === 0 && lead ? <AdSlot slot="homeBottom" label="광고" /> : null}
        </div>
      </section>

      <JsonLd data={[breadcrumbLd, listLd]} />
    </>
  );
}
