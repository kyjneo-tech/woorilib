import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CardDeductionCalculator } from "@/components/tools/CardDeductionCalculator";
import { ExclusionChecklist } from "@/components/tools/ExclusionChecklist";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "2026 연말정산 카드 소득공제 계산기 — 자녀 수 한도·추가공제까지",
  description:
    "총급여 25% 문턱, 2026년 개정 자녀 수별 기본한도(300·350·400만원), 전통시장·대중교통·문화체육 추가공제까지 계산합니다. 남은 12월에 어느 카드로 얼마를 써야 유리한지, 맞벌이 부부의 몰아주기 비교까지 한 화면에서 확인하세요.",
  keywords: [
    "카드 소득공제 계산기",
    "2026 연말정산",
    "신용카드 소득공제 한도",
    "체크카드 공제율",
    "자녀 수 소득공제 한도",
    "추가공제 전통시장 대중교통",
    "맞벌이 카드 몰아주기",
  ],
  alternates: { canonical: "/tools/card-deduction" },
  openGraph: {
    type: "website",
    url: `${SITE.url}/tools/card-deduction`,
    title: "2026 연말정산 카드 소득공제 계산기",
    description:
      "총급여 25% 문턱과 2026년 자녀 수별 기본한도를 반영해 내 카드 소득공제액과 실제 절세액을 계산합니다.",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 연말정산 카드 소득공제 계산기",
    description: "문턱·기본한도·추가공제 3단계 계산과 남은 12월 결제수단 코치까지.",
  },
};

const FAQ = [
  {
    q: "총급여 25%는 연봉 기준인가요?",
    a: "연봉이 아니라 원천징수영수증의 '총급여' 금액입니다. 비과세 소득(식대 일부, 차량 지원금 등)을 뺀 근로소득이 기준이라 연봉보다 작습니다. 연중 입사·퇴사했다면 근로를 제공한 기간에 쓴 금액만 반영됩니다.",
  },
  {
    q: "자녀가 3명이면 기본한도가 450만원인가요?",
    a: "아닙니다. 2026년 1월 1일 이후 사용분부터 기본한도는 총급여 7,000만원 이하에서 자녀 0명 300만원, 1명 350만원, 2명 이상 400만원입니다. 3명 이상도 400만원으로 같고, 총급여 7,000만원 초과는 250만·275만·300만원입니다.",
  },
  {
    q: "체크카드만 쓰는 게 항상 유리한가요?",
    a: "한도를 넘긴 금액에는 체크카드·현금영수증 30%가 신용카드 15%보다 두 배 유리합니다. 다만 총급여 25% 문턱 아래 사용액은 어떤 수단으로 써도 공제가 0원이라, 문턱을 신용카드로 채우든 체크카드로 채우든 공제액은 같습니다. 차이는 문턱을 넘긴 뒤에 생깁니다.",
  },
  {
    q: "도서·공연·문화체육 30%는 누구나 받을 수 있나요?",
    a: "총급여 7,000만원 이하인 근로자만 받습니다. 7,000만원을 넘으면 이 항목은 적용되지 않아, 도서·공연에 쓴 돈은 신용카드 15% 또는 체크카드 30%로만 계산됩니다. 이 계산기는 총급여가 7,000만원을 넘으면 문화비를 신용카드 사용액으로 옮겨 계산하고 안내합니다.",
  },
  {
    q: "한도를 넘기면 추가로 얼마까지 공제되나요?",
    a: "기본한도를 넘긴 공제액과 전통시장·대중교통·문화체육 공제액 중 작은 금액만큼 추가공제됩니다. 한도는 총급여 7,000만원 이하 300만원, 초과 200만원입니다. 신용카드로만 썼다면 한도에 닿는 순간 공제가 멈춘다고 보면 됩니다.",
  },
  {
    q: "맞벌이 부부는 서로 카드를 합쳐 공제받을 수 있나요?",
    a: "안 됩니다. 부부가 각자 근로소득이 있으면 각자 신고합니다. 배우자의 소득금액이 100만원(근로소득만 있으면 총급여 500만원) 이하일 때만 부양가족으로 합산할 수 있습니다. 맞벌이 비교 탭은 두 사람이 각자 신고하는 경우를 계산합니다.",
  },
  {
    q: "카드 공제 400만원이면 400만원을 돌려받나요?",
    a: "아닙니다. 카드 공제는 세액공제가 아니라 소득공제입니다. 400만원이 공제되면 과세표준이 400만원 줄고, 줄어든 만큼에 본인 한계세율을 곱한 금액만큼 세금이 줄어듭니다. 15% 구간이면 소득세 60만원, 지방소득세를 더해 약 66만원입니다.",
  },
  {
    q: "12월에 카드 사용을 늘리면 무조건 이득인가요?",
    a: "한도까지는 공제가 늘지만, 공제율 30%는 100만원을 써야 과세표준이 30만원 줄어드는 구조입니다. 그 30만원에 한계세율을 곱한 금액이 실제 절세액이라, 새로 쓰는 돈보다 작습니다. 이미 쓸 돈의 결제수단을 바꾸는 정도가 합리적입니다.",
  },
  {
    q: "2026년에 쓴 카드는 언제 정산되나요?",
    a: "2027년 초 연말정산에서 반영됩니다. 12월 31일 사용분까지 포함되고, 1월 중순에 열리는 국세청 연말정산간소화 서비스에서 카드·현금영수증 사용액을 확인할 수 있습니다.",
  },
  {
    q: "계산 결과와 회사 연말정산 결과가 다를 수 있나요?",
    a: "달라질 수 있습니다. 이 계산기는 카드 사용액과 총급여만으로 계산하고, 과세표준은 총급여로 추정합니다. 실제 과세표준은 부양가족 등록, 연금계좌·보험료·의료비·기부금 공제에 따라 달라져 한계세율이 바뀔 수 있습니다. 원천징수영수증의 과세표준을 알고 있다면 계산기에서 구간을 직접 고르세요.",
  },
];

export default function CardDeductionToolPage() {
  const url = `${SITE.url}/tools/card-deduction`;

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "2026 연말정산 카드 소득공제 계산기",
    url,
    applicationCategory: "FinanceApplication",
    applicationSubCategory: "세금 계산기",
    operatingSystem: "Web",
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    description:
      "총급여 25% 문턱, 자녀 수별 기본한도, 전통시장·대중교통·문화체육 추가공제를 반영해 2026년 귀속 신용카드 등 소득공제액과 예상 절세액을 계산합니다.",
    featureList: [
      "총급여 25% 최저사용금액 자동 계산",
      "2026년 개정 자녀 수별 기본한도 반영",
      "전통시장·대중교통·문화체육 추가공제 계산",
      "공제 제외 지출 차감 도우미",
      "남은 기간 결제수단 시뮬레이션",
      "맞벌이 부부 카드 배분 비교",
    ],
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "계산기", item: `${SITE.url}/tools` },
      { "@type": "ListItem", position: 3, name: "카드 소득공제 계산기", item: url },
    ],
  };

  return (
    <>
      <section className="tool-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href="/">홈</Link>
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
            <Link href="/tools">계산기</Link>
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">카드 소득공제 계산기</span>
          </nav>

          <p className="eyebrow">2026년 귀속 · 연말정산 도구</p>
          <h1 className="tool-hero__title">2026 연말정산 카드 소득공제 계산기</h1>
          <p className="tool-hero__desc">
            총급여의 25% 문턱, 2026년에 바뀐 자녀 수별 기본한도, 전통시장·대중교통·문화체육
            추가공제를 순서대로 계산합니다. 남은 12월에 어느 카드로 얼마를 써야 몇 원을 더 아끼는지도
            함께 알려 드립니다.
          </p>
          <ul className="tool-hero__meta">
            <li>조세특례제한법 제126조의2 기준</li>
            <li>2026년 1월 1일 이후 사용분 반영</li>
            <li>입력값은 서버로 전송되지 않습니다</li>
          </ul>
        </div>
      </section>

      <div className="wrap tool-wrap">
        <CardDeductionCalculator />

        <AdSlot slot="inArticleTop" label="계산기 아래 광고" />

        <article className="tool-doc prose">
          <h2 id="how">이 계산기는 무엇을 계산하나요</h2>
          <p>
            신용카드 등 소득공제는 &lsquo;얼마를 썼는지&rsquo;가 아니라 <strong>총급여의 25%를 넘긴
            금액</strong>, <strong>결제수단별 공제율</strong>, <strong>한도</strong> 세 가지로 결정됩니다.
            계산기는 이 순서를 그대로 따라갑니다.
          </p>
          <ol className="tool-steps">
            <li>
              <strong>문턱</strong> — 총급여 × 25%를 넘었는지 확인합니다. 넘지 못한 사용액은 공제가
              0원입니다.
            </li>
            <li>
              <strong>공제율</strong> — 문턱을 넘긴 금액을 신용카드 15%, 체크카드·현금영수증 30%,
              전통시장·대중교통 40%, 문화체육 30%로 나눠 계산합니다.
            </li>
            <li>
              <strong>한도</strong> — 기본한도(자녀 수 반영)를 적용하고, 넘은 금액은 전통시장·대중교통·문화체육
              공제액과 추가한도 안에서 추가로 인정합니다.
            </li>
          </ol>
          <p>
            여기에 세 단계를 더했습니다. 명세서에 찍혔지만 공제되지 않는 지출을 빼는 보조 입력, 남은
            기간 결제수단을 바꿀 때 늘어나는 공제액과 세금 감소액 비교, 그리고 맞벌이 부부가 어느 쪽
            카드로 결제하는 편이 유리한지의 비교입니다.
          </p>

          <h2 id="rates">결제수단·사용처별 공제율</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">사용 내역</th>
                  <th scope="col">공제율</th>
                  <th scope="col">적용 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">신용카드</th>
                  <td>15%</td>
                  <td>본인 명의 카드, 가족카드는 명의자 기준</td>
                </tr>
                <tr>
                  <th scope="row">체크카드·직불카드·기명식 선불카드, 현금영수증</th>
                  <td>30%</td>
                  <td>현금영수증은 발급받은 금액만</td>
                </tr>
                <tr>
                  <th scope="row">전통시장</th>
                  <td>40%</td>
                  <td>결제수단과 관계없이 적용</td>
                </tr>
                <tr>
                  <th scope="row">대중교통</th>
                  <td>40%</td>
                  <td>버스·지하철 등, 결제수단과 관계없이 적용</td>
                </tr>
                <tr>
                  <th scope="row">도서·공연·박물관·미술관·영화관·수영장·체력단련장</th>
                  <td>30%</td>
                  <td>총급여 7,000만원 이하만, 수영장·체력단련장은 2025년 7월 1일 이후 이용분</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            문턱을 채우는 순서는 <strong>공제율이 낮은 신용카드부터</strong>입니다. 그래서 같은
            금액을 써도 신용카드로 먼저 문턱이 채워지고, 체크카드 사용분은 그 위에 얹히는 구조가
            됩니다. 체크카드 사용액만 따로 떼어 보면 실제 공제액과 어긋나는 이유입니다.
          </p>

          <h2 id="limit">2026년 개정 — 자녀 수별 기본한도</h2>
          <p>
            2026년 1월 1일 이후 사용분부터 조세특례제한법 제126조의2 제10항이 개정되어, 자녀 등
            부양가족이 있는 근로자의 기본한도가 올라갔습니다.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">총급여</th>
                  <th scope="col">자녀 등 없음</th>
                  <th scope="col">1명</th>
                  <th scope="col">2명 이상</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">7,000만원 이하</th>
                  <td>300만원</td>
                  <td>350만원</td>
                  <td>400만원</td>
                </tr>
                <tr>
                  <th scope="row">7,000만원 초과</th>
                  <td>250만원</td>
                  <td>275만원</td>
                  <td>300만원</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            여기서 말하는 &lsquo;자녀 등&rsquo;은 직계비속(손자녀·동거입양자·위탁아동 포함) 중 20세
            이하(장애인은 나이 제한 없음)이고, 소득금액 100만원 이하이며, 다른 거주자의 기본공제를
            받지 않는 사람입니다. 배우자와 자녀의 기본공제를 누가 받을지 정하지 않았다면 연말정산 전에
            부양가족 등록 상태부터 확인하세요. 추가공제 한도(7,000만원 이하 300만원, 초과 200만원)는
            이번 개정과 별개로 그대로 유지됩니다.
          </p>

          <h2 id="additional">추가공제는 이렇게 계산됩니다</h2>
          <p>
            기본한도를 다 채웠을 때 남는 여지가 추가공제입니다. 산출 공제액이 기본한도를 넘으면
            &lsquo;넘은 금액&rsquo;과 &lsquo;전통시장·대중교통·문화체육 공제액 합계&rsquo; 중 작은
            금액을, 추가한도 안에서 더 인정합니다. 세 가지 중 가장 작은 값이 실제 추가공제액입니다.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">예시</th>
                  <th scope="col">산출 공제액</th>
                  <th scope="col">기본한도</th>
                  <th scope="col">추가공제</th>
                  <th scope="col">최종 공제액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">총급여 5,000만 · 자녀 2명 · 신용카드 3,500만</th>
                  <td>337만 5,000원</td>
                  <td>400만원</td>
                  <td>0원</td>
                  <td>337만 5,000원</td>
                </tr>
                <tr>
                  <th scope="row">총급여 6,000만 · 자녀 1명 · 신용 1,000만 + 체크 2,000만</th>
                  <td>450만원</td>
                  <td>350만원</td>
                  <td>0원</td>
                  <td>350만원</td>
                </tr>
                <tr>
                  <th scope="row">총급여 8,000만 · 자녀 2명 · 신용카드 4,000만</th>
                  <td>300만원</td>
                  <td>300만원</td>
                  <td>0원</td>
                  <td>300만원</td>
                </tr>
                <tr>
                  <th scope="row">총급여 5,000만 · 자녀 없음 · 전통시장만 4,000만</th>
                  <td>1,100만원</td>
                  <td>300만원</td>
                  <td>300만원</td>
                  <td>600만원</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            두 번째 예시에서 같은 3,000만원을 전부 신용카드로 썼다면 (3,000만원 − 1,500만원) × 15% =
            225만원입니다. 결제수단을 나눈 것만으로 125만원 차이가 납니다. 네 번째 예시는 한도를 넘긴
            공제액 800만원과 추가한도 300만원이 부딪혀 300만원까지만 인정된 경우입니다.
          </p>

          <h2 id="exclusions">공제에서 빠지는 지출 체크리스트</h2>
          <p>
            &ldquo;카드값은 많은데 공제는 적다&rdquo;는 느낌이 들 때 가장 먼저 볼 지점입니다. 아래
            항목은 카드 명세서에는 찍히지만 소득공제 대상 사용액에는 들어가지 않습니다. 해당되는 항목을
            눌러 표시해 두고, 계산기의 &lsquo;공제 제외 지출 빼기&rsquo;에 금액을 넣으면 실제에 가까운
            결과가 나옵니다.
          </p>
          <ExclusionChecklist />
          <p>
            월 관리비·공과금이 카드로 자동결제되고 있다면 그 금액은 사용액에는 잡혀도 공제는 되지
            않습니다. 반대로 휴대폰 요금 중 콘텐츠 구매처럼 통신요금이 아닌 항목, 학원비처럼 공납금이
            아닌 교육 서비스는 공제 대상이 될 수 있으니 결제 내역을 나눠 확인하는 편이 정확합니다.
          </p>

          <h2 id="tax-saving">공제액과 &lsquo;돌려받는 돈&rsquo;은 다릅니다</h2>
          <p>
            카드 공제는 세액공제가 아니라 소득공제입니다. 공제액 337만 5,000원은 과세표준을 그만큼
            줄여 줄 뿐이고, 실제 세금 감소액은 줄어든 금액에 본인 한계세율을 곱한 값입니다. 과세표준이
            15% 구간이라면 소득세 50만 6,250원, 지방소득세 10%를 더해 약 55만 7,000원입니다.
          </p>
          <p>
            이 계산기는 총급여와 자녀 수로 과세표준 구간을 추정하지만, 추정에는 가정이 들어갑니다.
            근로소득공제만 반영하고 기본공제는 본인·배우자·자녀로 가정하며, 국민연금 4.5%와 건강보험 등
            3.8%를 소득공제로 넣습니다. 주택자금·연금저축·의료비·기부금 공제는 넣지 않습니다. 실제
            과세표준이 다르면 계산기에서 구간을 직접 고르는 편이 정확합니다.
          </p>

          <h2 id="faq">자주 묻는 질문</h2>
          <div className="faq">
            {FAQ.map((item) => (
              <section className="faq__item" key={item.q}>
                <h3 className="faq__q">{item.q}</h3>
                <p className="faq__a">{item.a}</p>
              </section>
            ))}
          </div>

          <h2 id="assumptions">계산기가 가정한 것</h2>
          <ul>
            <li>금액은 원 단위로 계산하고, 공제액과 세금은 원 단위에서 반올림합니다.</li>
            <li>최저사용금액은 총급여 × 25%에서 원 미만을 버립니다.</li>
            <li>지방소득세는 소득세의 10%로 계산합니다(소득세 15% → 지방세 포함 16.5%).</li>
            <li>문화체육 30%는 총급여 7,000만원 이하에만 적용하고, 초과 시 신용카드 15%로 계산합니다.</li>
            <li>부부 합산은 계산하지 않습니다. 각자 근로소득이 있으면 각자 신고합니다.</li>
            <li>입력한 값은 브라우저 안에서만 계산되고 어디에도 저장·전송되지 않습니다.</li>
          </ul>

          <h2 id="sources">근거 자료</h2>
          <ul>
            <li>
              국가법령정보센터 — 조세특례제한법 제126조의2, 같은 법 시행령 제121조의2:{" "}
              <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">
                law.go.kr
              </a>
            </li>
            <li>
              국세청 — 신용카드 등 사용액 공제율·공제한도 상담 사례:{" "}
              <a
                href="https://call.nts.go.kr/call/qna/selectQnaInfo.do?ctgId=CTG11898&mi=1318"
                target="_blank"
                rel="noopener noreferrer"
              >
                call.nts.go.kr
              </a>
            </li>
            <li>
              국세청 — 현금영수증·신용카드 수취 시 혜택(주요 세법 개정 내용):{" "}
              <a
                href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7794&mi=2466"
                target="_blank"
                rel="noopener noreferrer"
              >
                nts.go.kr
              </a>
            </li>
            <li>
              재정경제부 — 2025년 세제개편안 &lsquo;자녀 수에 따라 신용카드등 소득공제 한도
              확대&rsquo;:{" "}
              <a href="https://whatsnew.mofe.go.kr" target="_blank" rel="noopener noreferrer">
                whatsnew.mofe.go.kr
              </a>
            </li>
          </ul>

          <div className="tool-note">
            <p>
              <strong>같이 보면 좋은 글</strong> — 카드 공제 구조를 예시로 풀어 쓴{" "}
              <Link href="/posts/2026-card-deduction-limit">
                2026년 연말정산 카드 공제, 자녀 있으면 한도가 이만큼 늘어납니다
              </Link>
              에서 계산 과정을 더 자세히 볼 수 있습니다.
            </p>
            <p className="tool-note__date">계산 기준일 2026년 11월 15일 · 제도는 이후 바뀔 수 있습니다.</p>
          </div>
        </article>
      </div>

      <JsonLd data={[appLd, faqLd, breadcrumbLd]} />
    </>
  );
}
