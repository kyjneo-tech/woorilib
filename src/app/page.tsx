import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { PostCard } from "@/components/PostCard";
import { CATEGORY_LIST } from "@/lib/categories";
import { formatKoreanDate, getAllPosts, getPostsByCategory } from "@/lib/posts";

export const metadata: Metadata = {
  title: "우리집 라이브러리 — 연말정산·보험·생활 테크 실용 가이드",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const posts = getAllPosts();
  const [lead, ...rest] = posts;
  const latest = rest.slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero__inner">
            <p className="eyebrow">생활 실용 가이드</p>
            <h1 className="hero__title">
              매년 다시 찾아오는 생활 문제,
              <br />
              근거부터 정리해 둡니다.
            </h1>
            <p className="hero__desc">
              연말정산 카드 공제, 실손보험 청구, 집안 인터넷 속도처럼 한 번 정리해 두면 오래 쓰는
              문제를 다룹니다. 기사마다 근거 자료와 계산 과정을 함께 남깁니다.
            </p>
            <ul className="hero__points">
              <li>국세청·금융위 등 공식 자료 확인</li>
              <li>직접 계산한 예시 포함</li>
              <li>광고와 본문 구분 표시</li>
            </ul>
          </div>
        </div>
      </section>

      {lead ? (
        <section className="section">
          <div className="wrap">
            <div className="section__head">
              <h2 className="section__title">대표 글</h2>
              <Link className="section__more" href={`/category/${lead.category.slug}`}>
                {lead.category.label} 전체 보기 →
              </Link>
            </div>
            <PostCard post={lead} featured />
          </div>
        </section>
      ) : null}

      {latest.length > 0 ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section__head">
              <h2 className="section__title">최신 글</h2>
              <a className="section__more" href="/feed.xml">
                RSS로 구독 →
              </a>
            </div>
            <div className="grid grid--3">
              {latest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="wrap">
        <AdSlot slot="homeBottom" label="광고" />
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section__head">
            <h2 className="section__title">주제별로 찾기</h2>
            <Link className="section__more" href="/about">
              편집 원칙 보기 →
            </Link>
          </div>
          <div className="cat-grid">
            {CATEGORY_LIST.map((category) => {
              const count = getPostsByCategory(category.slug).length;
              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="cat-card"
                >
                  <p className="cat-card__label">{category.label}</p>
                  <p className="cat-card__desc">{category.description}</p>
                  <span className="cat-card__count">글 {count}편 →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {posts.length > 0 ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section__head">
              <h2 className="section__title">전체 글 목록</h2>
            </div>
            <ul className="post-list">
              {posts.map((post) => (
                <li key={post.slug} className="post-list__item">
                  <div>
                    <h3 className="post-list__title">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="post-list__desc">{post.description}</p>
                  </div>
                  <time className="post-list__date" dateTime={post.date}>
                    {formatKoreanDate(post.date)}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
