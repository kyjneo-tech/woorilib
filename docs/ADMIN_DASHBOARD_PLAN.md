# Admin Dashboard Implementation Plan

## 🎯 Objective
데이터 수집 현황을 한눈에 파악하고, AI가 수집한 도서를 검수/수정하며, 실제 큐레이션 결과를 시뮬레이션할 수 있는 **통합 관제 센터**를 구축한다.

---

## 📅 Roadmap & Checklist

### Phase 1: Backend Services & API (The Foundation)
- [ ] **Service: AdminStatsService**
    - `getDashboardStats()`: 총 도서 수, 상태별 카운트, 영역별 분포 계산.
    - `getRecentLogs()`: 최근 수집/수정된 도서 리스트 조회.
- [ ] **Service: AdminBooksService**
    - `getBooks(filter, page)`: 도서 목록 조회 (검색, 필터링 포함).
    - `updateBook(isbn, data)`: 도서 정보 수정 (코멘트, 상태 등).
    - `deleteBook(isbn)`: 도서 삭제 (Soft/Hard).
- [ ] **API Routes**
    - `GET /api/admin/stats`
    - `GET /api/admin/books`
    - `PATCH /api/admin/books/[isbn]`
    - `DELETE /api/admin/books/[isbn]`

### Phase 2: Dashboard UI (The Overview)
- [ ] **Layout Construction**
    - Sidebar Navigation (Dashboard, Books, Simulation).
    - Responsive Container.
- [ ] **Widget: KPI Cards**
    - Total Books, Needs Review Count, Today's Collection.
- [ ] **Widget: Status Traffic Light (Pie Chart)**
    - Verified vs Pending vs Rejected 비율 시각화.
- [ ] **Widget: Domain Radar Chart**
    - 5개 발달 영역(Communication, Nature, Art...) 분포도.
- [ ] **Widget: Recent Activity Log**
    - 최근 작업 내역 테이블.

### Phase 3: Book Management Center (The Workroom)
- [ ] **Book List Page**
    - Data Grid (Table) with Sort/Filter.
    - Status Badge (Color-coded).
    - Search Bar (Title, Author, ISBN).
- [ ] **Detail & Edit Modal**
    - Cover Image Preview (High Quality Check).
    - Metadata Editor (Title, Author, Age).
    - **Feature: Comment Tuner** (AI 코멘트 수정 기능).
    - **Feature: Status Switch** (Approve / Reject).

### Phase 4: Curation Simulator (The Playground)
- [ ] **Simulator Page**
    - Input Form: Age (Months), Propensity, Interests.
- [ ] **Preview Component**
    - `CurriculumService` 결과를 실제 사용자 UI와 동일하게 렌더링.
    - "이 설정으로 추천하면 이렇게 나옵니다" 확인용.

---

## 🧪 Verification Plan (Test Scenarios)

### 1. Data Accuracy Test
- [ ] DB에 `Verified` 상태인 책이 100권일 때, 대시보드 숫자가 100으로 정확히 뜨는가?
- [ ] 영역별 분포 합계가 전체 도서 수와 일치하는가?

### 2. Interaction Test (CRUD)
- [ ] '검수 필요' 책을 승인하면 즉시 '승인됨' 카운트가 올라가는가?
- [ ] 코멘트를 수정하고 저장하면, DB에 즉시 반영되는가?
- [ ] 검색창에 "자동차"를 치면 자동차 책만 필터링되는가?

### 3. Simulation Test
- [ ] 시뮬레이터에서 "30개월, 자동차" 입력 시, 실제 로직(`CurriculumService`)과 동일한 결과가 나오는가?
- [ ] 없는 키워드 입력 시 "데이터 부족" 알림이 적절히 뜨는가? (On-Demand 트리거 확인)

---

## 🛠 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Shadcn/UI components recommended if available)
- **Charts:** Recharts or Chart.js
- **State Management:** React Query (TanStack Query) for Admin Data fetching.
