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
          <h2>계산 예시로 결과를 확인해 봐요</h2>
          <p>특례·일반 기부금이 한도 안에 들어오고 산출세액이 충분하다고 놓고 계산한 예예요.</p>
          <table>
            <thead>
              <tr><th>한도 안의 특례·일반 기부금</th><th>소득세 계산</th><th>소득세 공제액</th></tr>
            </thead>
            <tbody>
              <tr><td>600만원</td><td>600만원 × 15%</td><td>90만원</td></tr>
              <tr><td>1,500만원</td><td>1,000만원 × 15% + 500만원 × 30%</td><td>300만원</td></tr>
              <tr><td>3,000만원</td><td>1,000만원 × 15% + 2,000만원 × 30%</td><td>750만원</td></tr>
            </tbody>
          </table>
          <p>소득세 공제액의 10%만큼 지방소득세도 줄어요. 1,500만원 예에서는 소득세 300만원에 지방소득세 30만원을 더해 330만원이에요.</p>
          <h2>기부금 한도는 소득금액으로 봐요</h2>
          <table>
            <thead>
              <tr><th>기부금 유형</th><th>공제 대상 기부금 한도</th></tr>
            </thead>
            <tbody>
              <tr><td>특례기부금</td><td>한도 계산에 쓰는 소득금액의 100%</td></tr>
              <tr><td>일반기부금, 종교단체에 낸 금액이 없을 때</td><td>소득금액의 30%</td></tr>
              <tr><td>일반기부금, 종교단체에 낸 금액이 있을 때</td><td>소득금액의 10% + 소득금액의 20%와 종교단체 외 일반기부액 중 작은 금액</td></tr>
            </tbody>
          </table>
          <p>직장인은 원천징수영수증의 근로소득금액을 기준으로 해요. 총급여를 그대로 넣으면 한도를 실제보다 크게 잡을 수 있어요.</p>
          <h2>계산기를 쓸 때 알아 둘 점</h2>
          <ul>
            <li>결과는 참고용이에요. 다른 공제를 반영한 실제 산출세액과 회사에서 정산하는 환급액은 다를 수 있어요.</li>
            <li>12월 31일까지 실제로 지급한 기부금만 올해 몫이에요. 영수증의 지급일을 확인해 주세요.</li>
            <li>특례·일반 기부금은 한도나 산출세액 때문에 남으면 다음 과세기간부터 10년 이월할 수 있어요. 정치자금과 고향사랑기부금은 이월할 수 없어요.</li>
          </ul>
          <h2>자주 묻는 질문</h2>
          <h3>12월에 후원을 신청했는데 돈은 1월 1일에 나갔어요. 올해 몫인가요?</h3>
          <p>실제 지급일이 1월 1일이면 다음 해 몫이에요. 영수증에 기록된 지급일을 확인해 보세요.</p>
          <h3>교회에 낸 금액만 있을 때도 일반기부금 한도가 30%인가요?</h3>
          <p>종교단체 외 일반기부금이 없다면 소득금액의 10%가 한도예요.</p>
          <h3>회사에서 환급해 준 돈이 계산기의 공제액보다 적어요.</h3>
          <p>공제액과 돌려받는 돈은 달라요. 환급액은 이미 낸 세금과 다른 공제까지 반영해 정해져요.</p>
          <h2>근거 자료</h2>
          <ul>
            <li><a href="https://www.law.go.kr/법령/소득세법/제59조의4" target="_blank" rel="noopener noreferrer">소득세법 제59조의4</a> — 기부금 세액공제</li>
            <li><a href="https://www.law.go.kr/법령/소득세법/제61조" target="_blank" rel="noopener noreferrer">소득세법 제61조</a> — 기부금 이월</li>
            <li><a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7874&amp;mi=2224" target="_blank" rel="noopener noreferrer">국세청 세액공제 안내</a></li>
          </ul>
        </article>
      </div>
      <JsonLd data={[breadcrumbLd, appLd]} />
    </>
  );
}
