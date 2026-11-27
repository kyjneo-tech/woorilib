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
          <h2>계산 예시로 결과를 확인해 봐요</h2>
          <p>
            아래는 차령 경감 전 금액을 기준으로, 정기분을 나누어 낼 때 12월 몫을 계산한 예예요. 배기량 전체에 해당 줄의 세율을 곱하고, 지방교육세 30%를 더한 뒤 절반을 구했어요.
          </p>
          <table>
            <thead>
              <tr><th>배기량</th><th>자동차세 연세액</th><th>교육세 포함 연세액</th><th>교육세 포함 12월 몫</th></tr>
            </thead>
            <tbody>
              <tr><td>998cc</td><td>998 × 80 = 79,840원</td><td>103,792원</td><td>약 51,896원</td></tr>
              <tr><td>1,598cc</td><td>1,598 × 140 = 223,720원</td><td>290,836원</td><td>약 145,418원</td></tr>
              <tr><td>1,999cc</td><td>1,999 × 200 = 399,800원</td><td>519,740원</td><td>약 259,870원</td></tr>
            </tbody>
          </table>
          <p>
            차령 경감이 있는 예도 볼게요. 2022년에 처음 등록한 1,998cc 차의 2026년 차령은 5년이에요. 경감 전 연세액 399,600원에서 15%를 빼면 339,660원이고, 지방교육세를 더한 연간 합계는 441,558원, 12월 몫은 약 220,779원이에요.
          </p>
          <h2>계산기를 쓸 때 알아 둘 점</h2>
          <ul>
            <li>비영업용 승용차의 표준세율을 사용해요. 영업용 승용차, 화물차, 승합차에는 이 계산이 맞지 않을 수 있어요.</li>
            <li>지자체는 조례로 표준세율을 최대 50%까지 초과해 정할 수 있어요. 등록 지역에 따라 실제 금액이 다를 수 있어요.</li>
            <li>원 단위 절사 때문에 고지서와 수십 원 차이가 날 수 있어요. 납부할 때는 고지서나 위택스에 표시된 금액을 기준으로 해 주세요.</li>
            <li>12월 중 차를 팔거나 말소했다면 실제 보유기간에 따라 금액이 달라질 수 있어요.</li>
          </ul>
          <h2>자주 묻는 질문</h2>
          <h3>중고차를 샀는데 차령에는 구입 연도를 적나요?</h3>
          <p>자동차등록증에 적힌 최초 등록 연도를 입력해 주세요. 차령은 처음 등록된 해부터 세요.</p>
          <h3>12월 1일에 내 차였는데 그 뒤에 팔면 하반기 전액을 내나요?</h3>
          <p>기준일에 내 명의였다면 2기분 납세의무자는 나예요. 다만 실제 보유기간에 따라 일할 계산될 수 있으니 과세기간과 이전 등록일을 맞춰 보세요.</p>
          <h3>전기차인데 12월에 고지서가 안 왔어요.</h3>
          <p>6월 고지서에서 연간 자동차세와 지방교육세를 한꺼번에 냈는지 확인해 주세요. 올해분을 모두 냈다면 12월에 따로 낼 금액이 없어요.</p>
          <h2>근거 자료</h2>
          <ul>
            <li><a href="https://www.law.go.kr/법령/지방세법/제127조" target="_blank" rel="noopener noreferrer">지방세법 제127조</a> — 자동차세의 세율</li>
            <li><a href="https://www.law.go.kr/법령/지방세법/제128조" target="_blank" rel="noopener noreferrer">지방세법 제128조</a> — 납기와 납세의무자 기준일</li>
            <li><a href="https://www.law.go.kr/법령/지방세법/제151조" target="_blank" rel="noopener noreferrer">지방세법 제151조</a> — 지방교육세</li>
          </ul>
        </article>
      </div>
      <JsonLd data={[breadcrumbLd, appLd]} />
    </>
  );
}
