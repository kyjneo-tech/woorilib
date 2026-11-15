# 우리집 라이브러리 — woorilib.com

생활 속 돈·세금·보험·테크 문제를 근거 자료와 함께 정리하는 한국어 실용 가이드 매거진입니다.
Next.js(App Router) 기반 정적 블로그로, **데이터베이스·외부 API·환경변수 없이** 빌드됩니다.

- 배포: Vercel (Free 플랜에서 그대로 동작)
- 도메인: `https://woorilib.com`
- AdSense 게시자 ID: `pub-4234312634957489`

> ⚠️ 기존 `woorilib.com` 앱(도서관 서비스) 코드는 **`backup/legacy-woorilib` 브랜치**에 그대로 보관되어 있습니다.

---

## 기술 스택

| 구분 | 사용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, 정적 생성 / SSG) |
| 언어 | TypeScript (strict) |
| 스타일 | `src/app/globals.css` 단일 스타일시트 (CSS 프레임워크 없음) |
| 콘텐츠 | `content/posts/*.md` + `gray-matter` + `marked` |
| 배포 | Vercel |

DB, Prisma, Supabase, 인증, 서버 런타임 의존성은 모두 제거했습니다. `npm install && npm run build`만으로 끝납니다.

## 시작하기

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 (모든 페이지 정적 생성)
npm run start    # 빌드 결과 실행
npm run lint     # ESLint
npm run typecheck # tsc --noEmit
```

## 디렉터리 구조

```
content/posts/            글 원고 (Markdown + frontmatter)
public/
  ads.txt                 AdSense 승인용 (google.com, pub-…, DIRECT, …)
  images/posts/           글 커버 이미지 (1200×630 PNG)
  icon.png, apple-icon.png
scripts/generate-covers.py 커버 이미지 생성기 (Pillow)
src/
  app/
    layout.tsx            <html lang="ko">, 메타데이터, AdSense 스크립트
    page.tsx              홈 (대표 글 / 최신 글 / 카테고리 / 전체 목록)
    posts/[slug]/page.tsx 글 상세 (JSON-LD, 목차, 관련 글)
    category/[category]/  카테고리별 목록
    about/, privacy/      소개 / 개인정보처리방침
    robots.ts             /robots.txt
    sitemap.ts            /sitemap.xml
    feed.xml/route.ts     RSS 2.0 (/feed.xml)
  components/             헤더, 푸터, 카드, 목차, 광고 슬롯
  lib/                    사이트 설정, 카테고리, 글 파싱, 마크다운 렌더러
```

## 글 추가하기

`content/posts/` 에 `영문-슬러그.md` 파일을 만들고 아래 frontmatter를 채웁니다.

```yaml
---
title: "글 제목"
description: "검색 결과와 카드에 노출될 1~2문장 요약"
date: "2026-11-15"
updated: "2026-11-15"
category: "money"        # money | insurance | living
tags: ["연말정산", "소득공제"]
slug: "my-post-slug"     # 영문 소문자·숫자·하이픈만
cover: "/images/posts/my-post-slug.png"
coverAlt: "커버 이미지 설명"
---
```

- `date`/`updated`는 `YYYY-MM-DD` 형식입니다. `updated`를 비우면 `date`를 사용합니다.
- `cover` 경로의 파일이 `public/` 안에 실제로 있어야 빌드가 통과합니다(없으면 빌드 에러로 알려 줍니다).
- 본문은 GFM Markdown을 씁니다. `##` 소제목마다 목차(`sec-1`, `sec-2` …)가 자동 생성됩니다.
- 새 글을 추가하면 홈·카테고리·사이트맵·RSS·관련 글이 빌드 시 자동 반영됩니다.

### 커버 이미지

```bash
python3 scripts/generate-covers.py   # 스타일 템플릿으로 PNG 생성 (Pillow 필요)
```

`scripts/generate-covers.py`의 `cover(...)` 호출을 복사해 제목·부제만 바꾸면 톤이 같은 커버가 나옵니다.

## AdSense 설정

1. `public/ads.txt` — 승인에 필요한 한 줄이 들어 있습니다. 값이 바뀌면 여기만 수정하세요.
2. 광고 스크립트 — `src/app/layout.tsx`의 `<head>`에 `ca-pub-4234312634957489` 스크립트가 들어 있습니다.
3. 광고 슬롯 — `src/lib/site.ts`의 `ADSENSE.slots`에 애드센스 콘솔에서 만든 **광고 단위 번호**를 넣습니다.

```ts
slots: {
  inArticleTop: "1234567890",   // 글 상단
  inArticleBottom: "",          // 글 하단 (비우면 렌더링 안 함)
  homeBottom: "",               // 홈 하단
}
```

번호를 비워 두면 해당 위치에는 아무것도 렌더링되지 않습니다(빈 박스·레이아웃 흔들림 없음).
`AdSlot` 컴포넌트는 `adsbygoogle` 스크립트가 실제로 로드된 뒤에만 광고를 그립니다.

## Vercel 배포

1. Vercel에서 `kyjneo-tech/woorilib` 저장소를 Import (Framework: Next.js 자동 감지).
2. 환경변수 없이 그대로 Deploy.
3. Settings → Domains 에서 `woorilib.com`, `www.woorilib.com` 추가.
4. Route 53에서 Vercel이 안내하는 레코드로 연결:
   - 루트(`woorilib.com`): Vercel이 지정한 **A 레코드**(예: `76.76.21.21`) 또는 ALIAS
   - `www`: **CNAME** → `cname.vercel-dns.com`
   - 기존 Route 53의 A/CNAME 레코드는 Vercel 값으로 교체
5. DNS 전파 후 Vercel에서 인증서 자동 발급 확인.
6. 배포 후 확인: `https://woorilib.com/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/feed.xml`.
7. Google Search Console·AdSense에 `https://woorilib.com/sitemap.xml` 제출.

## 라이선스 / 운영

- 사이트의 글과 이미지는 우리집 라이브러리가 직접 작성·제작한 것입니다.
- 문의·정정 요청 창구는 `src/app/about/page.tsx`의 '운영과 문의' 절에 안내되어 있습니다.
