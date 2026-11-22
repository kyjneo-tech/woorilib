import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { DonationDeductionCalculator } from "@/components/tools/DonationDeductionCalculator";
import { SITE } from "@/lib/site";

const path = "/tools/donation-deduction";
const title = "2026 연말정산 기부금 세액공제 계산기";
const description =
  "특례·일반·종교단체·정치자금·고향사랑 기부금의 공제 대상액과 한도 초과액, 지방소득세를 포함한 예상 공제액을 계산해요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { type: "website", url: `${SITE.url}${path}`, title, description, locale: "ko_KR" },
  twitter: { card: "summary", title, description },
};

export default function DonationDeductionToolPage() {
  const url = `${SITE.url}${path}`;
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "계산기", item: `${SITE.url}/tools` },
      { "@type": "ListItem", position: 3, name: "기부금 세액공제 계산기", item: url },
    ],
  };

  return (
    <>
      <section className="tool-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href="/">홈</Link>
            <span className="crumbs__sep" aria-hidden="true">/</span>
            <Link href="/tools">계산기</Link>
            <span className="crumbs__sep" aria-hidden="true">/</span>
            <span aria-current="page">기부금 세액공제 계산기</span>
          </nav>
          <p className="eyebrow">2026년 귀속 · 연말정산 도구</p>
          <h1 className="tool-hero__title">{title}</h1>
          <p className="tool-hero__desc">{description}</p>
        </div>
      </section>

      <div className="wrap tool-wrap">
        <DonationDeductionCalculator />
        <AdSlot slot="inArticleTop" label="계산기 아래 광고" />
        <article className="tool-doc prose">
          <h2>기부금 세액공제는 이렇게 계산해요</h2>
          <ol className="tool-steps">
            <li>근로소득금액과 기부금 유형별 한도로 공제에 넣을 금액을 정해요.</li>
            <li>한도 안의 특례·일반 기부금을 합쳐 1,000만원까지 15%, 그 초과분에는 30%를 적용해요.</li>
            <li>정치자금·고향사랑기부금은 각각의 구간으로 계산하고, 소득세 공제액의 10%를 지방소득세 공제액으로 더해요.</li>
          </ol>
          <p>
            12월 31일까지 지급한 기부금이 올해 연말정산에 들어가요. 영수증 확인과 이월공제는{" "}
            <Link href="/posts/donation-tax-credit-2026">2026년 기부금 세액공제 안내</Link>에서 살펴보세요.
          </p>
        </article>
      </div>
      <JsonLd data={[breadcrumbLd, appLd]} />
    </>
  );
}
