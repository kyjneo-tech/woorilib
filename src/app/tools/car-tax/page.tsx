import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CarTaxCalculator } from "@/components/tools/CarTaxCalculator";
import { SITE } from "@/lib/site";

const path = "/tools/car-tax";
const title = "2026 자동차세 계산기 — 배기량·차령으로 2기분 확인";
const description =
  "비영업용 승용차의 배기량과 최초 등록 연도를 넣으면 지방교육세를 포함한 연세액과 12월 예상액을 볼 수 있어요. 전기·수소 승용차는 차종만 선택해 주세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { type: "website", url: `${SITE.url}${path}`, title, description, locale: "ko_KR" },
  twitter: { card: "summary", title, description },
};

export default function CarTaxToolPage() {
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
      { "@type": "ListItem", position: 3, name: "자동차세 계산기", item: url },
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
            <span aria-current="page">자동차세 계산기</span>
          </nav>
          <p className="eyebrow">2026년 · 비영업용 승용차</p>
          <h1 className="tool-hero__title">{title}</h1>
          <p className="tool-hero__desc">{description}</p>
        </div>
      </section>

      <div className="wrap tool-wrap">
        <CarTaxCalculator />
        <AdSlot slot="inArticleTop" label="계산기 아래 광고" />
        <article className="tool-doc prose">
          <h2>고지서와 계산 결과를 맞춰 봐요</h2>
          <ol className="tool-steps">
            <li>배기량으로 계산하는 승용차는 해당 구간의 표준세율을 전체 배기량에 곱해요. 차령이 3년 이상이면 경감을 반영해요.</li>
            <li>경감 후 자동차세에 지방교육세 30%를 더해요. 전기·수소 승용차는 차령과 관계없이 교육세를 포함해 연 13만원이에요.</li>
            <li>정기분을 나누어 내면 12월 몫은 연세액의 절반이에요. 올해분을 연납했거나 6월에 전액 납부했다면 납부 내역을 확인해 주세요.</li>
          </ol>
          <p>
            12월 중 차를 팔거나 말소했다면 실제 보유기간에 따라 고지액이 달라질 수 있어요.{" "}
            <Link href="/posts/car-tax-december-2026">2026 자동차세 2기분 안내</Link>에서 등록 시점별 납세의무자와 납부 기간을 확인해 보세요.
          </p>
        </article>
      </div>
      <JsonLd data={[breadcrumbLd, appLd]} />
    </>
  );
}
