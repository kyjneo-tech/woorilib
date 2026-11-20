import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "계산기 도구 — 연말정산 카드 공제액을 직접 계산하는 페이지",
  description:
    "2026년 연말정산 카드 소득공제 계산기를 회원가입 없이 바로 써 보세요. 총급여 25% 문턱, 자녀 수별 기본한도, 전통시장·대중교통 추가공제, 12월 결제수단 비교, 맞벌이 비교까지 한 화면에서 계산해요.",
  alternates: { canonical: "/tools" },
  openGraph: {
    type: "website",
    url: `${SITE.url}/tools`,
    title: "계산기 도구 — 우리집 라이브러리",
    description: "연말정산 카드 소득공제 계산기와 계산 순서 안내를 한 페이지에 모았어요.",
    locale: "ko_KR",
  },
};

const TOOLS = [
  {
    href: "/tools/card-deduction",
    title: "2026 연말정산 카드 소득공제 계산기",
    description:
      "총급여 25% 문턱, 2026년에 바뀐 자녀 수별 기본한도, 전통시장·대중교통·문화체육 추가공제를 한 번에 계산해요. 남은 기간 결제수단 비교와 맞벌이 비교도 들어 있어요.",
    tags: ["연말정산", "카드 공제", "자녀 수 한도"],
  },
];

const STEPS = [
  {
    title: "숫자를 먼저 모아요",
    description:
      "총급여(비과세를 뺀 금액)와 신용카드·체크카드 사용액, 전통시장·대중교통에서 쓴 금액을 적어 두면 돼요. 원천징수영수증이나 카드사 앱의 연간 사용내역에서 확인할 수 있어요.",
  },
  {
    title: "계산기에 넣어요",
    description:
      "입력칸은 만원과 원 중 편한 단위로 바꿀 수 있어요. 숫자를 넣는 순간 결과 카드가 같이 바뀌어서 정답을 기다릴 필요가 없어요.",
  },
  {
    title: "결과 두 숫자를 구분해서 읽어요",
    description:
      "공제액은 과세표준을 줄여 주는 금액이고, 예상 절세액은 그만큼 줄어드는 세금이에요. 공제액 400만원이 세금 400만원이 되는 건 아니에요.",
  },
  {
    title: "12월 계획을 정해요",
    description:
      "'③ 남은 기간, 어느 카드로 쓸까' 칸에서 결제수단을 바꿨을 때 늘어나는 공제액과 세금 감소액을 나란히 볼 수 있어요. 새로 쓰는 돈을 만드는 것보다, 이미 쓸 돈의 결제수단을 바꾸는 데 쓰는 게 좋아요.",
  },
];

const SITUATIONS = [
  [
    "올해 카드 공제가 얼마나 나올지 궁금해요",
    "총급여, 신용카드·체크카드 사용액",
    "내 공제 계산 탭",
    "약 3분",
  ],
  [
    "12월에 어느 카드로 긁어야 유리한지 정해야 해요",
    "지금까지 쓴 금액, 연말까지 쓸 예상 금액",
    "'③ 남은 기간, 어느 카드로 쓸까'",
    "약 5분",
  ],
  [
    "맞벌이인데 누구 카드로 결제할지 고민이에요",
    "두 사람의 총급여와 사용액",
    "맞벌이 비교 탭",
    "약 5분",
  ],
  [
    "명세서에 찍혔는데 공제가 안 되는 지출이 궁금해요",
    "명세서에 찍힌 결제 내역",
    "공제 제외 지출 입력칸",
    "약 5분",
  ],
];

const FAQ = [
  {
    question: "입력한 숫자는 어디로 가나요?",
    answer:
      "어디로도 가지 않아요. 계산은 브라우저 안에서만 이루어지고, 입력값을 서버로 보내거나 저장하지 않아요. 회원가입도 필요 없고, 창을 닫으면 입력한 숫자도 그냥 사라져요.",
  },
  {
    question: "계산 결과와 회사 연말정산 결과가 다를 수 있나요?",
    answer:
      "달라질 수 있어요. 계산기는 카드 사용액과 총급여만 보고 계산하고, 과세표준은 총급여로 어림해서 잡아요. 실제로는 부양가족 등록, 연금계좌·보험료·의료비·기부금 공제에 따라 과세표준과 세율 구간이 달라져요. 확정된 금액은 국세청 연말정산간소화 서비스나 회사 인사팀 안내로 확인해 주세요.",
  },
  {
    question: "총급여를 모르면 어떻게 하나요?",
    answer:
      "급여명세서나 원천징수영수증에 적힌 '총급여'를 보면 돼요. 연봉이 아니라 비과세 소득(식대 일부, 차량 지원금 같은 것)을 뺀 금액이라 연봉보다 조금 작아요. 정확한 숫자가 없으면 연봉에서 비과세를 대략 빼고 넣어 봐도 흐름은 볼 수 있어요.",
  },
  {
    question: "자녀가 3명이면 한도가 더 늘어나나요?",
    answer:
      "아니에요. 2026년 1월 1일 이후 사용분부터 기본한도는 총급여 7,000만원 이하일 때 자녀 0명 300만원, 1명 350만원, 2명 이상 400만원이에요. 3명 이상도 400만원으로 같고, 총급여가 7,000만원을 넘으면 250만·275만·300만원이 돼요.",
  },
];

const GUIDES = [
  {
    href: "/posts/2026-card-deduction-limit",
    title: "2026년 연말정산 카드 공제, 자녀 있으면 한도가 이만큼 늘어납니다",
    description: "카드 공제가 어떻게 계산되는지 예시와 함께 처음부터 보고 싶다면",
  },
  {
    href: "/posts/cash-receipt-deduction-calculator-2026",
    title: "현금영수증 소득공제 한도 계산기, 2026년엔 이 순서로 계산합니다",
    description: "현금영수증 30%가 정확히 무슨 뜻인지, 계산 순서까지",
  },
  {
    href: "/posts/incheon-eum-card-deduction-2026",
    title: "이음카드(인천e음) 소득공제, 신청 안 하면 30%를 놓칩니다",
    description: "인천e음(이음카드)로 30% 소득공제를 받는 신청 방법",
  },
  {
    href: "/posts/silson-claim-guide-2026",
    title: "실손보험 청구, 병원 서류 없이 끝내는 방법 — 2026년 기준 확인할 5가지",
    description: "병원비 실손보험 청구, 서류 없이 끝내는 순서",
  },
  {
    href: "/posts/samsung-fire-silson-claim-docs-2026",
    title: "삼성화재 실손보험 청구 서류, 통원·입원·약제비별로 정리했습니다",
    description: "삼성화재 실손 청구 서류를 통원·입원·약제비별로",
  },
  {
    href: "/posts/wifi-slow-check",
    title: "집 와이파이가 느려졌을 때, 돈 안 들이고 확인하는 8단계",
    description: "집 와이파이가 느려졌을 때 돈 안 들이고 확인하는 순서",
  },
];

export default function ToolsPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "계산기", item: `${SITE.url}/tools` },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "우리집 라이브러리 계산기 도구",
    itemListElement: TOOLS.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      url: `${SITE.url}${tool.href}`,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href="/">홈</Link>
            <span className="crumbs__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">계산기</span>
          </nav>
          <h1 className="page-head__title">계산기</h1>
          <p className="page-head__desc">
            연말정산 카드 공제처럼 숫자로 따져 봐야 하는 생활 문제를 브라우저에서 바로 계산해 보는 페이지예요. 계산기는 법 조문에 적힌 순서를 그대로 옮기고, 기사에 실은 예시와 같은 결과가 나오는지 확인한 뒤에 올려요. 회원가입도, 앱 설치도 필요 없어요.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="grid grid--2">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="cat-card">
                <p className="cat-card__label">{tool.title}</p>
                <p className="cat-card__desc">{tool.description}</p>
                <p className="cat-card__count">{tool.tags.join(" · ")} →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="prose tool-doc" style={{ marginTop: 0 }}>
            <h2 id="how-to-use">도구를 쓰는 순서</h2>
            <p>처음 왔다면 이 순서대로 따라 해 보세요. 준비물이 몇 개 없어서 3분이면 끝나요.</p>
            <ol>
              {STEPS.map(({ title, description }) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </li>
              ))}
            </ol>

            <h2 id="situations">어떤 상황에서 무엇을 보면 좋을까</h2>
            <p>같은 계산기라도 궁금한 것에 따라 먼저 볼 화면이 달라요. 아래 표에서 내 상황을 찾아보세요.</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">궁금한 것</th>
                    <th scope="col">미리 준비할 것</th>
                    <th scope="col">볼 화면</th>
                    <th scope="col">걸리는 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {SITUATIONS.map(([question, preparation, screen, time]) => (
                    <tr key={question}>
                      <th scope="row">{question}</th>
                      <td>{preparation}</td>
                      <td>{screen}</td>
                      <td>{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              표에 적힌 시간은 숫자를 미리 적어 둔 상태를 기준으로 한 어림값이에요. 입력칸이 많지 않아서
              한 번 익히면 1~2분이면 끝나요.
            </p>

            <h2 id="faq">자주 묻는 질문</h2>
            {FAQ.map(({ question, answer }) => (
              <div key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
            ))}

            <h2 id="guides">함께 읽으면 좋은 글</h2>
            <ul>
              {GUIDES.map(({ href, title, description }) => (
                <li key={href}>
                  <Link href={href}>{title}</Link>
                  <br />
                  {description}
                </li>
              ))}
            </ul>

            <h2 id="standards">계산 기준을 밝히는 이유</h2>
            <p>
              세금 계산기는 숫자 하나만 틀려도 사용자가 엉뚱한 결정을 내릴 수 있어요. 그래서 계산기는
              법 조문에 적힌 순서를 지키고, 근거 자료를 페이지마다 같이 적어 둬요. 카드 소득공제라면
              조세특례제한법 제126조의2와 같은 법 시행령 제121조의2가 기준이에요.
            </p>
            <p>
              계산 결과는 참고용이에요. 실제 공제액과 환급액은 회사 연말정산, 부양가족 등록 상태, 그
              밖의 소득공제에 따라 달라질 수 있어요. 신청 전에 국세청 연말정산간소화 서비스나 회사
              인사팀 안내를 함께 확인해 주세요.
            </p>
            <p>
              <small>
                이 페이지는 2026년 11월 20일에 내용을 다듬었어요. 법령이나 한도가 바뀌면 그때 다시
                고쳐요.
              </small>
            </p>
          </div>
        </div>
      </section>

      <JsonLd data={[breadcrumbLd, listLd, faqLd]} />
    </>
  );
}
