import Link from "next/link";
import { CATEGORY_LIST } from "@/lib/categories";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__name">{SITE.name}</p>
          <p className="site-footer__desc">{SITE.tagline}</p>
        </div>

        <nav className="site-footer__nav" aria-label="바닥글 메뉴">
          <div>
            <p className="site-footer__heading">카테고리</p>
            <ul>
              {CATEGORY_LIST.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`}>{category.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="site-footer__heading">사이트</p>
            <ul>
              <li>
                <Link href="/about">소개</Link>
              </li>
              <li>
                <Link href="/privacy">개인정보처리방침</Link>
              </li>
              <li>
                <a href="/feed.xml">RSS</a>
              </li>
              <li>
                <Link href="/sitemap.xml">사이트맵</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="wrap site-footer__legal">
        <p>
          © {new Date().getFullYear()} {SITE.name}. 모든 글은 일반적인 정보 제공을 목적으로 하며,
          개별 상황의 세무·법률·의학적 판단을 대신하지 않습니다.
        </p>
        <p>
          금액·기한 등 제도는 바뀔 수 있으니 실제 신청 전에 국세청·금융위원회 등 공식 안내를 함께
          확인하세요.
        </p>
      </div>
    </footer>
  );
}
