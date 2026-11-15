import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "계산기 — 연말정산·생활 비용을 직접 계산해 보는 도구",
  description:
    "우리집 라이브러리의 계산 도구 모음입니다. 2026년 연말정산 카드 소득공제 계산기로 총급여 25% 문턱, 자녀 수별 한도, 추가공제와 예상 절세액을 계산할 수 있습니다.",
  alternates: { canonical: "/tools" },
  openGraph: {
    type: "website",
    url: `${SITE.url}/tools`,
    title: "계산기 — 우리집 라이브러리",
    description: "연말정산 카드 소득공제 계산기 등 생활 비용을 직접 계산하는 도구를 모읍니다.",
    locale: "ko_KR",
  },
};

const TOOLS = [
  {
    href: "/tools/card-deduction",
    title: "2026 연말정산 카드 소득공제 계산기",
    description:
      "총급여 25% 문턱, 2026년 개정 자녀 수별 기본한도, 전통시장·대중교통·문화체육 추가공제를 반영해 소득공제액과 예상 절세액을 계산합니다. 남은 기간 결제수단 시뮬레이션과 맞벌이 비교도 포함합니다.",
    tags: ["연말정산", "카드 공제", "자녀 수 한도"],
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
    name: "우리집 라이브러리 계산기",
    itemListElement: TOOLS.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      url: `${SITE.url}${tool.href}`,
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
            기사에 적힌 숫자를 그대로 믿기 어려울 때 쓰는 도구입니다. 법 조문과 시행령에 적힌 계산
            순서를 그대로 코드로 옮기고, 기사에 실은 예시와 같은 결과가 나오는지 검증한 뒤에
            올립니다.
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
            <h2>계산 기준을 밝히는 이유</h2>
            <p>
              세금·보험 계산기는 숫자 하나가 틀려도 사용자가 잘못된 결정을 내릴 수 있습니다. 그래서
              계산기는 법 조문에 적힌 순서를 지키고, 근거 자료를 페이지마다 함께 적습니다. 카드
              소득공제라면 조세특례제한법 제126조의2와 같은 법 시행령 제121조의2가 기준입니다.
            </p>
            <p>
              계산 결과는 참고용입니다. 실제 공제액과 환급액은 회사의 연말정산, 부양가족 등록 상태,
              그 밖의 소득공제에 따라 달라질 수 있으므로, 신청 전에 국세청 연말정산간소화 서비스나
              회사 인사팀 안내를 함께 확인하세요.
            </p>
          </div>
        </div>
      </section>

      <JsonLd data={[breadcrumbLd, listLd]} />
    </>
  );
}
