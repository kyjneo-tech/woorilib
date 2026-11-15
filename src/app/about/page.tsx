import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "소개 — 무엇을, 어떤 기준으로 쓰는지",
  description:
    "우리집 라이브러리가 다루는 주제와 편집 원칙, 근거 자료 확인 방식, 광고와 본문을 구분하는 기준을 안내합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const posts = getAllPosts();

  return (
    <div className="wrap">
      <section className="page-head">
        <nav className="crumbs" aria-label="현재 위치" style={{ padding: 0 }}>
          <Link href="/">홈</Link>
          <span className="crumbs__sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">소개</span>
        </nav>
        <h1 className="page-head__title">소개</h1>
        <p className="page-head__desc">
          우리집 라이브러리는 생활 속에서 반복되는 돈·보험·테크 문제를 한 번에 정리해 두는 실용
          가이드입니다.
        </p>
      </section>

      <div className="doc">
        <h2>왜 이런 글을 쓰나요</h2>
        <p>
          연말정산 카드 공제 한도, 실손보험 청구 서류, 집 와이파이가 느려졌을 때 확인할 순서 같은
          문제는 매년, 또는 몇 달에 한 번씩 다시 찾아옵니다. 그런데 정작 필요한 정보는 여러 기관의
          안내문과 카드사·보험사 페이지에 흩어져 있고, 해마다 숫자가 조금씩 바뀝니다.
        </p>
        <p>
          {SITE.name}는 그런 주제를 <strong>한 편의 글 안에서 순서대로 따라갈 수 있게</strong>{" "}
          정리합니다. 결론만 알려 주는 대신, 어떤 조건에서 그 숫자가 나오는지와 직접 계산한 예시를
          함께 둡니다.
        </p>

        <h2>편집 원칙</h2>
        <ul>
          <li>
            <strong>근거를 먼저 확인합니다.</strong> 금액·기한·요건은 국세청, 금융위원회,
            보험개발원 등 1차 자료를 확인한 뒤 씁니다. 확인한 날짜를 글에 남깁니다.
          </li>
          <li>
            <strong>확인하지 못한 숫자는 쓰지 않습니다.</strong> 통계나 가격이 필요할 때는 출처가
            확인된 값만 인용하고, 추정치는 추정이라고 밝힙니다.
          </li>
          <li>
            <strong>계산 과정을 공개합니다.</strong> 공제액·자기부담금처럼 계산이 필요한 부분은
            가정한 조건과 계산식을 같이 적어, 독자가 자기 숫자로 바꿔 볼 수 있게 합니다.
          </li>
          <li>
            <strong>개인정보는 최소한으로.</strong> 사이트 운영에 필요한 정보 외에는 수집하지
            않으며, 가족이나 지인의 실명·연락처는 글에 쓰지 않습니다.
          </li>
          <li>
            <strong>광고는 광고라고 표시합니다.</strong> 본문과 광고 영역은 시각적으로 구분되어
            있고, 광고주가 글의 내용을 정하지 않습니다.
          </li>
        </ul>

        <h2>다루는 주제</h2>
        <ul>
          <li>
            <strong>돈·세금</strong> — 연말정산, 소득공제·세액공제, 카드·계좌 관리
          </li>
          <li>
            <strong>보험·의료비</strong> — 실손보험 청구, 자기부담금, 병원비 서류
          </li>
          <li>
            <strong>생활·테크</strong> — 집안 인터넷, 무선 공유기, 생활 속 기기 설정
          </li>
        </ul>
        <p>
          지금까지 <strong>{posts.length}편</strong>의 글을 정리해 두었습니다. 새 글은{" "}
          <a href="/feed.xml">RSS</a>로 구독할 수 있습니다.
        </p>

        <h2>주의해 주세요</h2>
        <p>
          이 사이트의 글은 일반적인 정보 제공을 목적으로 합니다. 개인의 소득·가입 이력·건강 상태에
          따라 결과가 달라질 수 있으므로, 세무·법률·의학적 판단을 대신하지 않습니다. 실제 신청이나
          치료 결정 전에는 국세청 홈택스·연말정산간소화 서비스, 금융위원회·보험개발원(실손24), 또는
          해당 기관·전문가의 안내를 함께 확인하시기 바랍니다.
        </p>

        <h2>운영과 문의</h2>
        <p>
          {SITE.name}(woorilib.com)는 생활 정보 콘텐츠를 직접 조사·정리해 발행하는 사이트입니다.
          사이트 운영 비용은 페이지에 표시되는 광고 수익으로 충당합니다.
        </p>
        <p>
          오류 정정 요청이나 제안은 사이트 운영 채널을 통해 받고 있으며, 확인되는 대로 글에 반영하고
          수정 날짜를 표시합니다. 개인정보 처리에 관한 내용은{" "}
          <Link href="/privacy">개인정보처리방침</Link>에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
