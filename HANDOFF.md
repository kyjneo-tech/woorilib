# 우리아이도서관 (Woorilib) 프로젝트 인수인계 문서

> **마지막 업데이트:** 2026-01-19
> **프로젝트 경로:** `/Users/admin/Desktop/woorilib`
> **기술 스택:** Next.js 16 + TypeScript + TailwindCSS + Supabase + Prisma

---

## 🎯 프로젝트 개요

어린이 도서 검색, 도서관/중고서점 재고 확인, 독서 기록 관리를 위한 PWA 웹앱.
주요 타겟: 0-8세 자녀를 둔 부모.

---

## ✅ 구현 완료된 기능

### Phase 1: 핵심 기능 (100% 완료)

| 기능 | 파일 위치 | 설명 |
|------|----------|------|
| **지도 기능** | `src/features/map/` | 카카오맵 기반 도서관/알라딘 매장 위치 표시 |
| **알라딘 매장 데이터** | `src/shared/data/aladin-stores.ts` | 전국 50개 매장 정적 데이터 |
| **중고 가격/재고** | `src/features/acquisition/` | 알라딘 API 연동, 중고 가격 비교 |
| **가족 관리** | `src/features/family/` | 다자녀 CRUD (Prisma 연동) |

### Phase 2: 사용자 경험 (100% 완료)

| 기능 | 파일 위치 | 설명 |
|------|----------|------|
| **간편 독서 기록** | `src/features/reading-record/ui/QuickReadButton.tsx` | 책 상세페이지에서 원클릭 기록 |
| **비슷한 책 추천** | `src/features/recommendation/ui/SimilarBooksSection.tsx` | 같은 저자/분류 책 추천 |
| **PWA 설정** | `src/app/manifest.ts` | 설치 가능한 웹앱 설정 |

### Phase 3: 소셜 & 추천 (부분 완료)

| 기능 | 상태 | 파일 위치 |
|------|------|----------|
| **또래 인기 도서** | ✅ 완료 | `src/features/popular-books/` |
| **베스트셀러** | ✅ 완료 | 알라딘 API Route Handler: `src/app/api/aladin/[...endpoint]/route.ts` |
| **챌린지/뱃지 UI** | ✅ UI만 완료 | `src/features/challenge/` |
| **한줄평** | ❌ 미구현 | DB 스키마만 존재 (`book_reviews` 테이블) |
| **또래 비교 대시보드** | ❌ 미구현 | RPC 함수만 존재 (`get_peer_comparison`) |

---

## ❌ 미구현 기능 (다음 AI가 해야 할 일)

### 우선순위 1: 한줄평 기능 ⭐⭐⭐
- **DB 스키마:** `supabase/migrations/002_family_and_reading.sql` 내 `book_reviews` 테이블 이미 생성됨
- **필요 작업:**
  1. `src/features/review/` 폴더 생성
  2. `ReviewCard.tsx` - 한줄평 표시 UI
  3. `ReviewForm.tsx` - 작성 폼 (100자 제한)
  4. `review.service.ts` - CRUD 로직
  5. 책 상세페이지(`src/app/book/[isbn]/page.tsx`)에 연동

### 우선순위 2: 또래 비교 대시보드 ⭐⭐
- **DB 함수:** `supabase/migrations/003_peer_popular_rpc.sql` 내 `get_peer_comparison` 함수 존재
- **필요 작업:**
  1. `src/features/peer-comparison/` 폴더 생성
  2. 우리 아이 vs 또래 평균 비교 UI
  3. 상위 % 표시 (예: "상위 15%")

### 우선순위 3: 챌린지 데이터 연동
- **현재 상태:** UI만 완료 (`ChallengeCard.tsx`, `BadgeGrid.tsx`)
- **필요 작업:** `challenge.service.ts`와 Supabase `user_challenges`, `user_badges` 테이블 연동 확인

### Phase 4 (전체 미구현)
- [ ] 독서 타임라인 - 월별/나이별 독서 기록 시각화
- [ ] 빠른 액션 버튼 - 검색 결과 카드에 담기/도서관/공유 버튼
- [ ] 성장 그래프 - 독서량 변화 라인 그래프
- [ ] PWA 아이콘 - `public/icons/` 폴더에 아이콘 파일 추가 필요 (현재 404)

---

## 🗄️ 데이터베이스 구조

### Supabase 마이그레이션 (모두 적용 완료)

```
supabase/migrations/
├── 001_bookshelf.sql        # 책장 테이블, RLS 정책
├── 002_family_and_reading.sql  # 자녀, 독서기록, 챌린지, 뱃지, 한줄평 테이블
└── 003_peer_popular_rpc.sql    # get_peer_popular_books, get_peer_comparison 함수
```

### 주요 테이블
| 테이블 | 용도 |
|--------|------|
| `bookshelf` | 내 책장 (읽고싶은/읽는중/완료) |
| `children` | 자녀 프로필 |
| `reading_records` | 독서 기록 |
| `challenges` | 챌린지 정의 (초기 데이터 6개 삽입됨) |
| `user_challenges` | 사용자별 챌린지 진행상황 |
| `user_badges` | 획득한 뱃지 |
| `book_reviews` | 한줄평 (미사용 상태) |

### Prisma 스키마
- 경로: `prisma/schema.prisma`
- `UserProfile`, `ChildProfile`, `Bookshelf` 모델 정의됨
- DB 컬럼명은 snake_case, Prisma는 camelCase 사용 (@map 매핑)

---

## 🔑 환경변수

**파일:** `.env.local` (실제 값), `.env` (템플릿)

| 변수명 | 용도 | 상태 |
|--------|------|------|
| `LIBRARY_API_KEY` | 도서관정보나루 API | ✅ 작동 |
| `ALADIN_TTB_KEY` | 알라딘 Open API | ✅ 작동 (오타 수정됨) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 | ✅ 작동 |
| `NAVER_CLIENT_ID/SECRET` | 네이버 도서 API | 미사용 (예비) |
| `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` | Supabase 연결 | ✅ 작동 |
| `DATABASE_URL`, `DIRECT_URL` | Prisma DB 연결 | ✅ 작동 |

---

## 📂 프로젝트 구조

```
src/
├── app/                      # Next.js App Router 페이지
│   ├── api/
│   │   ├── aladin/[...endpoint]/route.ts  # 알라딘 API 프록시
│   │   └── bookshelf/route.ts
│   ├── book/[isbn]/page.tsx  # 책 상세 (QuickReadButton, SimilarBooks 연동됨)
│   ├── home/page.tsx         # 홈 (PeerPopularSection 연동됨)
│   ├── search/page.tsx
│   ├── my-bookshelf/page.tsx
│   └── settings/page.tsx
├── entities/                 # 도메인 엔티티
│   └── book/api/
│       ├── aladin-api.client.ts   # 알라딘 API (Route Handler 경유)
│       └── library-api.client.ts  # 도서관정보나루 API
├── features/                 # 기능별 모듈 (FSD Lite 아키텍처)
│   ├── acquisition/          # 중고 가격/재고
│   ├── book-search/          # 검색 UI
│   ├── bookshelf/            # 책장 CRUD
│   ├── challenge/            # 챌린지/뱃지 (UI만)
│   ├── family/               # 가족 관리
│   ├── map/                  # 지도
│   ├── popular-books/        # 또래 인기/베스트셀러
│   ├── reading-record/       # 독서 기록
│   └── recommendation/       # 비슷한 책 추천
├── shared/                   # 공통 유틸/설정
│   ├── config/constants.ts   # AGE_GROUPS 등 상수
│   ├── data/aladin-stores.ts # 알라딘 매장 50개
│   └── lib/supabase/         # Supabase 클라이언트
└── scripts/
    └── migrate.js            # DB 마이그레이션 스크립트
```

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 마이그레이션 (이미 적용됨, 필요시만)
node scripts/migrate.js
```

---

## ⚠️ 알려진 이슈

1. **PWA 아이콘 404:** `public/icons/` 폴더에 아이콘 없음 (기능에 영향 없음)
2. **챌린지 데이터 연동 미확인:** UI는 완료, 실제 DB 연동 테스트 필요
3. **한줄평 기능 미구현:** DB 스키마만 존재, UI/서비스 로직 필요

---

## 📝 참고 문서

- 알라딘 API 스펙: `/Users/admin/Desktop/woorilib/Aladin Open API.json`
- 구현 계획서: `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_PLAN_v2.md`
