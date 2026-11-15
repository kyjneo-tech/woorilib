import Link from "next/link";
import { SITE } from "@/lib/site";
import { SiteNav } from "./SiteNav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Link href="/" className="wordmark" aria-label={`${SITE.name} 홈으로`}>
          <span className="wordmark__mark" aria-hidden="true" />
          <span className="wordmark__text">
            우리집 <em>라이브러리</em>
          </span>
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
