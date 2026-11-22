/**
 * 사이트 전역 설정 — 브랜드, 도메인, AdSense 식별자.
 * 값이 바뀌면 이 파일만 고치면 된다.
 */

export const SITE = {
  name: "우리집 라이브러리",
  wordmark: "우리집 라이브러리",
  url: "https://woorilib.com",
  locale: "ko-KR",
  tagline: "생활 속 돈·보험·테크 문제를 정리해 주는 실용 가이드",
  description:
    "우리집 라이브러리는 연말정산, 보험·의료비, 집안 인터넷처럼 매년 다시 찾아오는 생활 문제를 근거 자료와 함께 정리해 주는 한국어 실용 가이드 매거진입니다.",
  publisherName: "우리집 라이브러리 편집팀",
  defaultCover: "/images/og-default.png",
  /** AdSense 검토용 기본 이미지 (1200×630) */
  logo: "/images/og-default.png",
} as const;

/**
 * Google AdSense 설정.
 * - client: <head>에 넣는 애드센스 스크립트의 ca-pub 값
 * - publisherId: ads.txt 에 들어가는 pub 값
 * - slots: 애드센스 콘솔에서 만든 광고 단위(data-ad-slot) 번호.
 *   비워 두면 해당 위치에는 광고 영역이 아예 렌더링되지 않는다(레이아웃 깨짐 없음).
 */
export const ADSENSE = {
  client: "ca-pub-4234312634957489",
  publisherId: "pub-4234312634957489",
  scriptSrc:
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4234312634957489",
  slots: {
    /** 글 상단(목차 아래) */
    inArticleTop: "",
    /** 글 하단(관련 글 위) */
    inArticleBottom: "",
    /** 홈 최신 글 목록 아래 */
    homeBottom: "",
  },
} as const;

export type AdSlotKey = keyof typeof ADSENSE.slots;

/**
 * 애드센스 스크립트를 실제 HTML에 넣을지 결정한다.
 *
 * - 로컬 개발(127.0.0.1·localhost)과 Vercel Preview 배포에서는 스크립트를 넣지 않는다.
 *   그대로 두면 애드센스 보고서에 127.0.0.1·preview 페이지뷰가 섞여 실제 수익이 흐려진다.
 * - 운영(Vercel production)에서는 자동으로 켜진다.
 * - 다른 호스팅으로 옮겼을 때는 NEXT_PUBLIC_ADSENSE_ENABLED=1 로 직접 켜고,
 *   0 으로 두면 강제로 끌 수 있다.
 */
export function adsenseScriptEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ADSENSE_ENABLED;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return process.env.VERCEL_ENV === "production";
}

export const NAV = [
  { href: "/", label: "홈" },
  { href: "/tools/card-deduction", label: "계산기" },
  { href: "/category/money", label: "돈·세금" },
  { href: "/category/insurance", label: "보험·의료비" },
  { href: "/category/living", label: "생활·테크" },
  { href: "/about", label: "소개" },
] as const;
