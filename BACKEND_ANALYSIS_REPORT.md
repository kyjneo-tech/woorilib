# Woorilib 백엔드 시스템 심층 분석 보고서

**작성일:** 2026년 2월 9일
**분석 대상:** Woorilib 프로젝트 (Next.js App Router, Prisma, Supabase)

---

## 1. 아키텍처 개요 (Architecture Overview)

이 프로젝트는 **Next.js 15 (App Router)**를 기반으로 한 풀스택 아키텍처를 채택하고 있으며, 데이터베이스 계층에는 **Supabase (PostgreSQL)**와 **Prisma ORM**을 사용합니다.

### 1.1 기술 스택 (Tech Stack)
- **Framework:** Next.js 16 (App Router, Server Actions)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma Client
- **Authentication:** Supabase Auth
- **External APIs:** 알라딘 TTB API, 정보나루(Data4Library) API, 네이버 검색 API
- **Deployment:** Vercel (추정)

### 1.2 폴더 구조 패턴 (FSD 지향)
프로젝트는 기능 중심의 모듈형 구조(`Feature-Sliced Design`의 변형)를 따르고 있습니다.
- `src/features/*`: 비즈니스 로직의 핵심 (예: `curation`, `recommendation`, `bookshelf`)
- `src/entities/*`: 도메인 엔티티 정의 (예: `book`, `user`)
- `src/shared/*`: 공통 유틸리티 및 설정 (예: `prisma`, `config`)

---

## 2. 데이터베이스 모델링 분석 (Database Modeling)

`prisma/schema.prisma` 분석 결과, 데이터 모델은 크게 **사용자 컨텍스트**, **도서 메타데이터**, **큐레이션/통계** 세 가지 영역으로 나뉩니다.

### 2.1 핵심 모델 (Core Models)
1.  **`ChildProfile` (자녀 프로필):**
    - `birthYear`, `propensity`(성향), `interests`(관심사)를 저장하여 개인화 추천의 기준점이 됩니다.
    - **특이점:** `userId`와 1:N 관계로, 다자녀 관리가 가능하도록 설계되었습니다.

2.  **`VerifiedBooks` (검증된 도서 데이터 - 중요 ⭐):**
    - 외부 API(알라딘 등)의 불안정한 데이터를 내부 표준으로 정규화하는 **캐싱 및 마스터 데이터** 역할을 합니다.
    - **핵심 필드:**
        - `developmental_areas`: 6대 발달 영역 (의사소통, 자연탐구 등) 태그.
        - `emotional_keywords`: 정서 분석 키워드.
        - `verification_status`: 데이터 품질 관리 상태 (`pending` -> `verified`).
    - **분석:** 이 테이블은 큐레이션 엔진의 성능을 결정짓는 가장 중요한 자산입니다.

3.  **`Bookshelf` & `ReadingRecords`:**
    - `Bookshelf`: 현재 보유/읽고 싶은 책 (Inventory).
    - `ReadingRecords`: 독서 이력 및 감상 (Log).
    - **관계:** `User`와 `Child` 모두와 연결되어 있어, 부모의 서재와 아이의 독서 기록을 구분하거나 통합할 수 있습니다.

---

## 3. 핵심 비즈니스 로직 (Core Business Logic)

### 3.1 상담 및 진단 엔진 (`ConsultationService`)
- **위치:** `src/features/curation/services/consultation.service.ts`
- **로직 흐름:**
    1.  **프로필 분석:** 아이의 월령(`ageMonths`)을 계산.
    2.  **보유 도서 분류:** 사용자의 `Bookshelf` 도서를 가져와 `VerifiedBooks`의 메타데이터나 제목 키워드를 기반으로 6대 발달 영역으로 분류 (`Matrix` 생성).
    3.  **밸런스 진단:** 특정 영역의 도서 비중이 10% 미만인 경우 '부족(Missing)'으로 판단.
    4.  **브릿징 추천 (Bridging Algo):**
        - 단순히 부족한 영역의 베스트셀러를 추천하는 것이 아님.
        - **Logic:** `부족한 영역(Weakness)` + `아이의 관심사(Strength)` = **거부감 없는 추천**.
        - 예: '자연탐구'가 부족하고 '공룡'을 좋아함 -> '공룡 백과사전' 추천.

### 3.2 도서 검색 및 등록 파이프라인
- **위치:** `src/app/api/books/lookup`, `src/app/barcode`
- **하이브리드 검색 전략:**
    1.  **1차 시도 (DB):** `VerifiedBooks`에서 ISBN으로 조회 (고품질, 빠른 응답).
    2.  **2차 시도 (External):** 실패 시 알라딘/정보나루 API 호출.
    3.  **데이터 보강:** 외부 API 결과를 실시간으로 보여주되, 사용자가 '내 서재에 추가'하는 순간 `VerifiedBooks`에 메타데이터를 비동기로 적재(Upsert)하여 자산화합니다.

### 3.3 바코드 스캔 시스템
- **특징:** 클라이언트 사이드(`BarcodeDetector` or `html5-qrcode`)에서 1차 스캔 후, 백엔드로 ISBN만 전송하여 트래픽 비용을 절감합니다.
- **호환성:** 안드로이드/PC(Native API)와 iOS(WASM Library)를 모두 지원하는 이중 구조로 개선됨.

---

## 4. 데이터 파이프라인 및 외부 연동

| 서비스 | 역할 | 사용 방식 | 의존성 위험도 |
| :--- | :--- | :--- | :--- |
| **알라딘 (Aladin)** | 신간 정보, 표지 이미지, 가격 | ISBN 조회, 검색 | 높음 (Rate Limit 존재) |
| **정보나루 (Data4Lib)** | 대출 통계, 연령별 인기도 | 추천 가중치 산정 | 중간 (통계적 데이터) |
| **네이버 검색** | 고화질 표지, 최저가 비교 | 보조 메타데이터 | 낮음 |

- **동기화 전략:** 실시간 API 호출에 의존하되, 핵심 데이터는 `VerifiedBooks`로 점진적 마이그레이션(Incremental Migration)을 수행하여 외부 의존성을 낮추는 구조입니다.

---

## 5. 시스템 강점 및 약점 분석

### ✅ 강점 (Strengths)
1.  **정교한 추천 알고리즘:** 단순 랭킹이 아닌, 사용자의 '보유 도서 분포'와 '관심사'를 결합한 **Context-Aware** 추천 방식을 사용합니다.
2.  **데이터 자산화 전략:** 외부 API에 휘둘리지 않고 자체 메타데이터(`VerifiedBooks`)를 구축하는 구조가 잘 설계되어 있습니다.
3.  **유연한 아키텍처:** Feature 기반 폴더 구조로 인해 기능을 독립적으로 수정하거나 확장하기 용이합니다.

### ⚠️ 약점 및 개선 포인트 (Improvements)
1.  **분류 정확도 의존성:** `ConsultationService`에서 책 제목만으로 영역을 분류하는 `fallbackClassification` 로직은 정확도가 떨어집니다. `VerifiedBooks`의 커버리지를 높이는 백그라운드 작업이 필수적입니다.
2.  **캐싱 레이어 부재:** 외부 API 호출에 대한 단기 캐싱(Redis 등)이 없어 트래픽 급증 시 외부 API 쿼터 제한에 걸릴 수 있습니다.
3.  **테스트 커버리지:** 핵심 로직인 `ConsultationService` 외에, 외부 API 연동 부분에 대한 Mocking Test가 더 보강되어야 합니다.

---

## 6. 제안 (Recommendations)

1.  **분류 모델 고도화:** 현재의 키워드 기반 분류를 넘어, LLM(Gemini 등)을 활용해 도서 줄거리를 분석하고 6대 영역 태그를 자동 생성하는 배치 스크립트 도입 추천.
2.  **검색 성능 최적화:** `VerifiedBooks` 테이블에 Full-Text Search 인덱스(PostgreSQL `tsvector`) 적용 검토.
3.  **API Rate Limiting:** 외부 API 호출 실패 시 우회하거나 지수 백오프(Exponential Backoff)를 적용하는 유틸리티 추가.
