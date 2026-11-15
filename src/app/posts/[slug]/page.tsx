import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { TableOfContents } from "@/components/TableOfContents";
import { renderMarkdown } from "@/lib/markdown";
import { formatKoreanDate, getAllPosts, getPost, getRelatedPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };

  const url = `${SITE.url}/posts/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T09:00:00+09:00`,
      modifiedTime: `${post.updated}T09:00:00+09:00`,
      locale: "ko_KR",
      images: [{ url: post.cover, width: 1200, height: 630, alt: post.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.cover],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { html, toc } = renderMarkdown(post.content);
  const related = getRelatedPosts(post, 3);
  const url = `${SITE.url}/posts/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.description,
    image: [`${SITE.url}${post.cover}`],
    datePublished: `${post.date}T09:00:00+09:00`,
    dateModified: `${post.updated}T09:00:00+09:00`,
    inLanguage: "ko-KR",
    articleSection: post.category.label,
    keywords: post.tags.join(", "),
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: SITE.publisherName,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: post.category.label,
        item: `${SITE.url}/category/${post.category.slug}`,
      },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <article className="article">
      <div className="wrap">
        <nav className="crumbs" aria-label="현재 위치">
          <Link href="/">홈</Link>
          <span className="crumbs__sep" aria-hidden="true">
            /
          </span>
          <Link href={`/category/${post.category.slug}`}>{post.category.label}</Link>
          <span className="crumbs__sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{post.title}</span>
        </nav>

        <header className="article__head">
          <Link href={`/category/${post.category.slug}`} className="badge">
            {post.category.label}
          </Link>
          <h1 className="article__title">{post.title}</h1>
          <p className="article__lede">{post.description}</p>
          <p className="article__meta">
            <span>{SITE.publisherName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatKoreanDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes}분 읽기</span>
            {post.updated !== post.date ? (
              <>
                <span aria-hidden="true">·</span>
                <span>최종 수정 {formatKoreanDate(post.updated)}</span>
              </>
            ) : null}
          </p>
        </header>

        <figure className="article__cover">
          <Image
            src={post.cover}
            alt={post.coverAlt}
            width={1200}
            height={630}
            sizes="(max-width: 1080px) 100vw, 1080px"
            priority
          />
        </figure>

        <div className="article__layout">
          <div className="article__main">
            <TableOfContents items={toc} />
            <AdSlot slot="inArticleTop" label="본문 상단 광고" />

            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

            {post.tags.length > 0 ? (
              <ul className="tags" aria-label="태그">
                {post.tags.map((tag) => (
                  <li key={tag}>#{tag}</li>
                ))}
              </ul>
            ) : null}

            <AdSlot slot="inArticleBottom" label="본문 하단 광고" />

            {related.length > 0 ? (
              <section className="related" aria-labelledby="related-title">
                <h2 className="related__title" id="related-title">
                  함께 읽으면 좋은 글
                </h2>
                <div className="grid grid--3">
                  {related.map((item) => (
                    <PostCard key={item.slug} post={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="article__aside">
            <div className="aside-box">
              <p className="aside-box__title">이 글의 기준</p>
              <p>
                {formatKoreanDate(post.updated)} 기준으로 확인한 자료를 바탕으로 정리했습니다.
                제도·금액은 이후 바뀔 수 있으니 실제 신청 전에 관련 기관의 최신 안내를 함께
                확인하세요.
              </p>
            </div>
            <div className="aside-box">
              <p className="aside-box__title">우리집 라이브러리</p>
              <p>
                생활 속 돈·보험·테크 문제를 근거와 함께 정리하는 실용 가이드입니다.{" "}
                <Link href="/about">편집 원칙 보기</Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd data={[articleLd, breadcrumbLd]} />
    </article>
  );
}
