# E2E 테스트 계획

## 개요

본 문서는 Vibe Fortune 프로젝트의 E2E(End-to-End) 테스트 계획을 정의합니다.

**작성 기준:**
- `/docs/test-plan.md` - 테스트 환경 구축 계획
- `/docs/rules/tdd.md` - TDD 프로세스 가이드
- `/docs/persona.md` - MVP 개발 CTO 페르소나
- `/docs/pages/*/plan.md` - 각 페이지별 구현 계획

**테스트 전략:**
- 페이지별 사용자 플로우 중심의 E2E 테스트
- 실제 Supabase 인스턴스와 상호작용
- 구독 기능 통합 시나리오 검증
- 무한 스크롤, 검색, 페이지네이션 등 인터랙션 테스트

---

## 1. 페이지별 E2E 테스트 계획

### 1.1 홈 페이지 (/)

#### 1.1.1 테스트 목적
- 랜딩 페이지의 기본 렌더링 확인
- 인증 상태별 CTA 버튼 동작 검증
- 앵커 네비게이션 정상 작동 확인

#### 1.1.2 테스트 시나리오

**TC-HOME-001: 비로그인 사용자 - 페이지 로드**
- **전제 조건**: 비로그인 상태
- **테스트 단계**:
  1. URL `/`로 접근
  2. 페이지가 완전히 로드될 때까지 대기
  3. 모든 섹션 가시성 확인 (Hero, Features, Pricing, FAQ)
- **기대 결과**:
  - 페이지 로드 완료 (3초 이내)
  - 모든 섹션이 정상적으로 렌더링됨
  - "무료로 시작하기" 버튼 표시

**TC-HOME-002: 비로그인 사용자 - CTA 버튼 동작**
- **전제 조건**: 비로그인 상태, 홈 페이지 표시
- **테스트 단계**:
  1. Hero 섹션의 "무료로 시작하기" 버튼 클릭
  2. Clerk 로그인 모달 표시 여부 확인
  3. 모달에서 로그인 진행
- **기대 결과**:
  - Clerk 로그인 모달이 표시됨
  - 로그인 완료 후 대시보드로 자동 리다이렉트

**TC-HOME-003: 로그인 사용자 - CTA 버튼 동작**
- **전제 조건**: 로그인 상태, 홈 페이지 표시
- **테스트 단계**:
  1. Hero 섹션의 "이용하기" 버튼 클릭
  2. 대시보드 페이지로의 이동 확인
- **기대 결과**:
  - "이용하기" 버튼이 표시됨
  - 클릭 후 `/dashboard`로 이동

**TC-HOME-004: 앵커 네비게이션**
- **전제 조건**: 홈 페이지 표시
- **테스트 단계**:
  1. 헤더의 "서비스" 링크 클릭
  2. Features 섹션으로 부드럽게 스크롤되는지 확인
  3. 헤더의 "가격" 링크 클릭
  4. Pricing 섹션으로 부드럽게 스크롤되는지 확인
  5. 헤더의 "FAQ" 링크 클릭
  6. FAQ 섹션으로 부드럽게 스크롤되는지 확인
- **기대 결과**:
  - 모든 앵커 링크가 정상 작동
  - 부드러운 스크롤 애니메이션 적용

**TC-HOME-005: Pricing 섹션 - Pro 구독 버튼**
- **전제 조건**: 비로그인 상태, 홈 페이지 표시
- **테스트 단계**:
  1. Pricing 섹션에서 "Pro 시작하기" 버튼 클릭
  2. Clerk 로그인 모달 표시 여부 확인
  3. 로그인 후 구독 관리 페이지로의 이동 확인
- **기대 결과**:
  - Clerk 로그인 모달 표시
  - 로그인 후 구독 관리 페이지로 이동

**TC-HOME-006: FAQ 아코디언**
- **전제 조건**: 홈 페이지 표시, FAQ 섹션 가시
- **테스트 단계**:
  1. 첫 번째 FAQ 항목 클릭 (열기)
  2. 답변이 표시되는지 확인
  3. 다시 클릭 (닫기)
  4. 답변이 숨겨지는지 확인
- **기대 결과**:
  - FAQ 아코디언이 정상 작동
  - 열림/닫힘 애니메이션 적용

#### 1.1.3 테스트 케이스 파일

**파일**: `tests/e2e/home.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page (Landing Page)', () => {
  test('should load home page for unauthenticated users', async ({ page }) => {
    // TC-HOME-001
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hero = await page.locator('#hero').isVisible();
    const features = await page.locator('#features').isVisible();
    const pricing = await page.locator('#pricing').isVisible();
    const faq = await page.locator('#faq').isVisible();

    expect(hero).toBeTruthy();
    expect(features).toBeTruthy();
    expect(pricing).toBeTruthy();
    expect(faq).toBeTruthy();
  });

  test('unauthenticated user should see sign in button and trigger Clerk modal', async ({ page }) => {
    // TC-HOME-002
    await page.goto('/');

    const cta = page.locator('button:has-text("무료로 시작하기")').first();
    await cta.click();

    // Check for Clerk modal
    const clerkModal = page.locator('[role="dialog"]');
    await expect(clerkModal).toBeVisible();
  });

  test('authenticated user should see "Use Now" button and navigate to dashboard', async ({ page }) => {
    // TC-HOME-003
    // This requires authentication setup
    // Assuming there's a test user setup in beforeEach

    await page.goto('/');

    const ctaButton = page.locator('button:has-text("이용하기")');
    await expect(ctaButton).toBeVisible();

    await ctaButton.click();
    await page.waitForURL('/dashboard');

    expect(page.url()).toContain('/dashboard');
  });

  test('anchor navigation should work correctly', async ({ page }) => {
    // TC-HOME-004
    await page.goto('/');

    const servicesLink = page.locator('a:has-text("서비스")');
    await servicesLink.click();

    const featuresSection = page.locator('#features');
    const featuresBox = await featuresSection.boundingBox();
    expect(featuresBox).toBeTruthy();
  });

  test('FAQ accordion should toggle correctly', async ({ page }) => {
    // TC-HOME-006
    await page.goto('/');
    await page.locator('#faq').scrollIntoViewIfNeeded();

    const firstQuestion = page.locator('[role="button"]:has-text("어떻게 사용하나요?")').first();

    // Open
    await firstQuestion.click();
    await page.waitForTimeout(300);
    const answerVisible = await page.locator('text=/Google 계정으로 로그인/i').isVisible();
    expect(answerVisible).toBeTruthy();

    // Close
    await firstQuestion.click();
    await page.waitForTimeout(300);
  });
});
```

---

### 1.2 대시보드 페이지 (/dashboard)

#### 1.2.1 테스트 목적
- 로그인한 사용자의 사주분석 이력 조회 확인
- 검색 기능의 정상 작동 검증
- 페이지네이션 ("더보기" 버튼) 기능 확인
- 사이드바의 구독 정보 표시 확인

#### 1.2.2 테스트 시나리오

**TC-DASH-001: 로그인 필요 - 비로그인 사용자 리다이렉트**
- **전제 조건**: 비로그인 상태
- **테스트 단계**:
  1. URL `/dashboard`로 직접 접근 시도
  2. 리다이렉트 여부 확인
- **기대 결과**:
  - Clerk 로그인 페이지로 자동 리다이렉트

**TC-DASH-002: 이력 목록 표시**
- **전제 조건**: 로그인 상태, 최소 1개 이상의 사주분석 이력 보유
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 페이지 로드 완료 대기
  3. 사주분석 이력 카드 목록 표시 확인
  4. 카드에 표시되는 정보 확인 (이름, 생년월일, 성별, 분석 날짜)
- **기대 결과**:
  - 최신순으로 정렬된 이력 카드 표시 (최대 10개)
  - 각 카드에 사주분석 정보 명확히 표시

**TC-DASH-003: 이력 없을 때 빈 상태**
- **전제 조건**: 로그인 상태, 사주분석 이력 없음
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 빈 상태 화면 표시 여부 확인
- **기대 결과**:
  - "아직 사주분석 이력이 없습니다" 메시지 표시
  - "첫 검사 시작하기" 버튼 표시

**TC-DASH-004: 이력 카드 클릭 - 상세 페이지 이동**
- **전제 조건**: 로그인 상태, 사주분석 이력 1개 이상 보유
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 첫 번째 이력 카드 클릭
  3. 상세 페이지로의 이동 확인
- **기대 결과**:
  - `/dashboard/results/[id]` 페이지로 이동
  - 해당 사주분석의 상세 정보 표시

**TC-DASH-005: 검색 기능**
- **전제 조건**: 로그인 상태, 최소 3개 이상의 사주분석 이력 (서로 다른 이름)
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 검색 입력창에 이름 입력 (예: "홍")
  3. 300ms 후 필터링된 결과 확인
  4. 검색어 클리어
  5. 모든 이력 재표시 확인
- **기대 결과**:
  - 입력한 이름과 일치하는 이력만 필터링 표시
  - 검색 결과 0건일 때 "검색 결과가 없습니다" 메시지 표시
  - 검색 클리어 후 모든 이력 복구

**TC-DASH-006: 페이지네이션 ("더보기" 버튼)**
- **전제 조건**: 로그인 상태, 11개 이상의 사주분석 이력 보유
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 초기 10개 이력 표시 확인
  3. "더보기" 버튼 표시 확인
  4. "더보기" 버튼 클릭
  5. 추가 이력 로드 확인 (로딩 스피너 표시)
  6. 로드 완료 후 20개 이력 표시 확인
- **기대 결과**:
  - 초기 10개 이력 표시
  - "더보기" 버튼 표시 및 클릭 시 10개 추가 로드
  - 더 이상 로드할 이력이 없으면 "더보기" 버튼 숨김

**TC-DASH-007: 사이드바 구독 정보 표시**
- **전제 조건**: 로그인 상태 (무료/Pro 사용자)
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. 좌측 사이드바 확인 (데스크톱)
  3. 다음 정보 표시 확인:
     - 사용자 이메일
     - 현재 요금제 (무료/Pro)
     - 잔여 검사 횟수
     - 다음 결제일 (Pro인 경우)
- **기대 결과**:
  - 사이드바에 구독 정보 명확히 표시
  - 무료 사용자: "무료 요금제" 배지, 잔여 횟수 0-3회
  - Pro 사용자: "Pro 요금제" 배지, 잔여 횟수 0-10회, 다음 결제일 표시

**TC-DASH-008: 새 검사하기 버튼**
- **전제 조건**: 로그인 상태
- **테스트 단계**:
  1. 대시보드 페이지 접근
  2. "새 검사하기" 버튼 클릭
  3. 새 분석 페이지로의 이동 확인
- **기대 결과**:
  - `/dashboard/new` 페이지로 이동

#### 1.2.3 테스트 케이스 파일

**파일**: `tests/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test.describe('Dashboard Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // TC-DASH-001
    await page.goto('/dashboard');
    // Should be redirected by Clerk middleware
    // Expect to see login page or modal
    await page.waitForURL(/sign-in|login/i);
  });

  test('should display user analysis history', async ({ page, context }) => {
    // TC-DASH-002
    // Requires authenticated session
    // Setup: Login first, then navigate to dashboard

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const historyCards = page.locator('[role="button"]:has-text(/\\d{4}-\\d{2}-\\d{2}/)');
    const count = await historyCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify card content
    const firstCard = historyCards.first();
    const nameVisible = await firstCard.locator('text=/[가-힣]+/').isVisible();
    expect(nameVisible).toBeTruthy();
  });

  test('should show empty state when no history', async ({ page }) => {
    // TC-DASH-003
    // Requires authenticated session with no history

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const emptyState = page.locator('text=/아직 사주분석 이력이 없습니다/i');
    const isEmpty = await emptyState.isVisible();

    expect(isEmpty).toBeTruthy();
  });

  test('should navigate to detail page on card click', async ({ page }) => {
    // TC-DASH-004
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[role="button"]:has-text(/\\d{4}-\\d{2}-\\d{2}/)').first();
    await firstCard.click();

    await page.waitForURL(/\/dashboard\/results\/.+/);
    expect(page.url()).toMatch(/\/dashboard\/results\/[^/]+/);
  });

  test('search should filter results by name', async ({ page }) => {
    // TC-DASH-005
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="검색"]');
    await searchInput.fill('홍');

    // Wait for debounce (300ms) + render
    await page.waitForTimeout(500);

    const cards = page.locator('[role="button"]:has-text(/홍/)');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);

    // Clear search
    const clearButton = page.locator('button[aria-label*="clear"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  });

  test('pagination should load more items', async ({ page }) => {
    // TC-DASH-006
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const initialCards = page.locator('[role="button"]:has-text(/\\d{4}-\\d{2}-\\d{2}/)');
    const initialCount = await initialCards.count();

    const loadMoreButton = page.locator('button:has-text("더보기")');
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await page.waitForTimeout(1000);

      const updatedCards = page.locator('[role="button"]:has-text(/\\d{4}-\\d{2}-\\d{2}/)');
      const updatedCount = await updatedCards.count();

      expect(updatedCount).toBeGreaterThan(initialCount);
    }
  });

  test('sidebar should display subscription info', async ({ page }) => {
    // TC-DASH-007
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Desktop only
    const sidebar = page.locator('aside[class*="lg:block"]');

    if (await sidebar.isVisible()) {
      const email = sidebar.locator('text=/.*@.*\\..*./');
      const plan = sidebar.locator('text=/무료|Pro/');
      const testCount = sidebar.locator('text=/\\d+회/');

      expect(await email.isVisible()).toBeTruthy();
      expect(await plan.isVisible()).toBeTruthy();
      expect(await testCount.isVisible()).toBeTruthy();
    }
  });

  test('new analysis button should navigate to new page', async ({ page }) => {
    // TC-DASH-008
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newAnalysisButton = page.locator('button:has-text("새 검사하기")').first();
    await newAnalysisButton.click();

    await page.waitForURL('/dashboard/new');
    expect(page.url()).toContain('/dashboard/new');
  });
});
```

---

### 1.3 새 사주분석 페이지 (/dashboard/new)

#### 1.3.1 테스트 목적
- 새 사주분석 폼의 입력 및 검증 기능 확인
- 구독 상태별 모델 선택 및 분석 실행 검증
- 잔여 횟수 부족 시 구독 유도 동작 확인
- 분석 완료 후 상세 페이지 이동 검증

#### 1.3.2 테스트 시나리오

**TC-NEW-001: 폼 필드 입력 및 검증**
- **전제 조건**: 로그인 상태, 잔여 검사 횟수 1회 이상
- **테스트 단계**:
  1. 새 분석 페이지 접근
  2. 성함 입력: "홍길동"
  3. 생년월일 입력: "2000-01-01"
  4. 출생시간 선택: "14:30"
  5. 성별 선택: "남성"
  6. 제출 버튼 활성화 확인
  7. "검사 시작" 버튼 클릭
- **기대 결과**:
  - 모든 필드 정상 입력 가능
  - 필드 검증 실시간 동작
  - 제출 버튼 활성화 상태로 변경
  - API 호출 시 로딩 스피너 표시

**TC-NEW-002: 필드 검증 - 생년월일 형식**
- **전제 조건**: 로그인 상태
- **테스트 단계**:
  1. 새 분석 페이지 접근
  2. 생년월일에 잘못된 형식 입력: "2000-13-01" (월이 13)
  3. 에러 메시지 표시 확인
  4. 정상 형식으로 수정: "2000-01-01"
  5. 에러 메시지 사라짐 확인
- **기대 결과**:
  - 생년월일 형식 검증 정상 작동
  - 에러 메시지 명확히 표시
  - 수정 시 에러 자동 해제

**TC-NEW-003: 출생시간 모름 체크박스**
- **전제 조건**: 로그인 상태, 새 분석 페이지 표시
- **테스트 단계**:
  1. "출생시간 모름" 체크박스 클릭
  2. 시간 입력 필드 비활성화 확인
  3. 다시 체크박스 해제
  4. 시간 입력 필드 활성화 확인
- **기대 결과**:
  - 체크박스 상태에 따라 필드 활성/비활성 정상 작동

**TC-NEW-004: 무료 사용자 - flash 모델 사용**
- **전제 조건**: 무료 사용자 로그인 (test_count >= 1), 새 분석 페이지
- **테스트 단계**:
  1. 모든 필드 정상 입력
  2. "검사 시작" 클릭
  3. 분석 진행 (로딩 스피너 10-20초 표시)
  4. 분석 완료 후 상세 페이지 이동
  5. 데이터베이스 확인: model_used = 'flash'
- **기대 결과**:
  - flash 모델로 분석 실행
  - 10-20초 내 완료
  - 잔여 횟수 차감 확인

**TC-NEW-005: Pro 사용자 - pro 모델 사용**
- **전제 조건**: Pro 구독 사용자 로그인 (test_count >= 1), 새 분석 페이지
- **테스트 단계**:
  1. 모든 필드 정상 입력
  2. "검사 시작" 클릭
  3. 분석 진행 (로딩 스피너 20-40초 표시)
  4. 분석 완료 후 상세 페이지 이동
  5. 데이터베이스 확인: model_used = 'pro'
  6. 분석 결과에 Pro 전용 섹션 포함 확인 (직업운, 월별 운세)
- **기대 결과**:
  - pro 모델로 분석 실행
  - 20-40초 내 완료
  - 잔여 횟수 차감 확인
  - Pro 전용 분석 내용 포함

**TC-NEW-006: 잔여 횟수 부족 - 구독 유도**
- **전제 조건**: 사용자 로그인, test_count = 0
- **테스트 단계**:
  1. 새 분석 페이지 접근
  2. 모든 필드 정상 입력
  3. "검사 시작" 클릭
  4. 구독 유도 다이얼로그 표시 확인
  5. "구독하기" 버튼 클릭
  6. 구독 관리 페이지로 이동 확인
- **기대 결과**:
  - 다이얼로그: "검사 횟수 부족"
  - 무료 사용자 메시지 표시
  - "구독하기" 클릭 시 구독 관리 페이지로 이동

**TC-NEW-007: API 실패 - 에러 메시지**
- **전제 조건**: 로그인 상태, 잔여 횟수 1회 이상
- **테스트 단계**:
  1. 네트워크를 오프라인으로 설정
  2. 모든 필드 입력 후 "검사 시작" 클릭
  3. 에러 메시지 표시 확인
  4. 버튼 재활성화 확인
- **기대 결과**:
  - "분석 중 오류가 발생했습니다" 토스트 메시지
  - 잔여 횟수 차감 안함
  - 다시 시도 가능

#### 1.3.3 테스트 케이스 파일

**파일**: `tests/e2e/new-analysis.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test.describe('New Analysis Page', () => {
  test('should submit form with valid data', async ({ page }) => {
    // TC-NEW-001
    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.locator('input[name="name"]').fill('홍길동');
    await page.locator('input[name="birthDate"]').fill('2000-01-01');
    await page.locator('input[name="birthTime"]').fill('14:30');
    await page.locator('input[value="male"]').click();

    // Submit
    const submitButton = page.locator('button:has-text("검사 시작")');
    await expect(submitButton).toBeEnabled();

    await submitButton.click();
    await page.waitForTimeout(1000);

    // Should show loading spinner
    const spinner = page.locator('[role="status"]');
    await expect(spinner).toBeVisible();
  });

  test('should validate birth date format', async ({ page }) => {
    // TC-NEW-002
    await page.goto('/dashboard/new');

    const birthDateInput = page.locator('input[name="birthDate"]');
    await birthDateInput.fill('2000-13-01');

    // Should show error
    const errorMsg = page.locator('text=/생년월일을.*형식/i');
    await expect(errorMsg).toBeVisible();

    // Fix and error should disappear
    await birthDateInput.fill('2000-01-01');
    await expect(errorMsg).not.toBeVisible();
  });

  test('unknown birth time checkbox should toggle field', async ({ page }) => {
    // TC-NEW-003
    await page.goto('/dashboard/new');

    const checkbox = page.locator('input[type="checkbox"]:has-text("출생시간 모름")');
    const timeInput = page.locator('input[name="birthTime"]');

    // Initially enabled
    await expect(timeInput).toBeEnabled();

    // Check box
    await checkbox.check();
    await expect(timeInput).toBeDisabled();

    // Uncheck
    await checkbox.uncheck();
    await expect(timeInput).toBeEnabled();
  });

  test('free user should use flash model', async ({ page }) => {
    // TC-NEW-004
    // Requires authenticated free user with test_count >= 1

    await page.goto('/dashboard/new');

    // Fill and submit form
    await page.locator('input[name="name"]').fill('테스트');
    await page.locator('input[name="birthDate"]').fill('1990-05-15');
    await page.locator('input[value="female"]').click();

    const submitButton = page.locator('button:has-text("검사 시작")');
    await submitButton.click();

    // Wait for redirect to results page
    await page.waitForURL(/\/dashboard\/results\/.+/);

    // Verify in database that model_used = 'flash'
    // This would require access to DB query
  });

  test('should show subscription dialog when out of tests', async ({ page }) => {
    // TC-NEW-006
    // Requires user with test_count = 0

    await page.goto('/dashboard/new');

    // Fill form
    await page.locator('input[name="name"]').fill('테스트');
    await page.locator('input[name="birthDate"]').fill('1990-05-15');
    await page.locator('input[value="male"]').click();

    const submitButton = page.locator('button:has-text("검사 시작")');
    await submitButton.click();

    // Should show subscription dialog
    const dialog = page.locator('text=/검사 횟수가 부족합니다/i');
    await expect(dialog).toBeVisible();

    // Click subscribe
    const subscribeButton = page.locator('button:has-text("구독하기")');
    await subscribeButton.click();

    // Should navigate to subscription page
    await page.waitForURL('/subscription');
  });
});
```

---

### 1.4 사주분석 상세 페이지 (/dashboard/results/[id])

#### 1.4.1 테스트 목적
- 사주분석 상세 정보 표시 확인
- Pro/Free 모델별 분석 결과 차이 표현 검증
- 결과 클립보드 복사 기능 확인
- 네비게이션 기능 검증

#### 1.4.2 테스트 시나리오

**TC-RESULT-001: 분석 결과 상세 정보 표시**
- **전제 조건**: 로그인 상태, 기존 분석 이력 존재
- **테스트 단계**:
  1. 대시보드에서 특정 이력 클릭하여 상세 페이지 접근
  2. 다음 정보 표시 확인:
     - 검사자 이름
     - 생년월일 (YYYY-MM-DD 형식)
     - 출생시간 (HH:mm 형식 또는 "미상")
     - 성별 (남성/여성 배지)
     - 분석 날짜 (YYYY년 MM월 DD일)
     - 사용 모델 (Pro 고급 분석/기본 분석)
  3. 마크다운 형식 분석 결과 렌더링 확인
- **기대 결과**:
  - 모든 정보 명확히 표시
  - 마크다운이 올바르게 렌더링됨

**TC-RESULT-002: Pro 분석 결과 표시**
- **전제 조건**: Pro 모델로 생성된 분석 결과
- **테스트 단계**:
  1. 상세 페이지 접근
  2. "Pro 고급 분석" 배지 확인
  3. Pro 안내 메시지 확인
  4. 분석 결과에 직업운, 월별 운세 섹션 포함 확인
- **기대 결과**:
  - Pro 배지 표시 (Sparkles 아이콘 포함)
  - Pro 안내 메시지 표시
  - Pro 전용 섹션 포함

**TC-RESULT-003: Free 분석 결과 표시**
- **전제 조건**: flash 모델로 생성된 분석 결과
- **테스트 단계**:
  1. 상세 페이지 접근
  2. "기본 분석" 배지 확인
  3. Free 안내 메시지 확인
- **기대 결과**:
  - "기본 분석" 배지 표시
  - Free 안내 메시지 표시

**TC-RESULT-004: 결과 복사 기능**
- **전제 조건**: 분석 상세 페이지 표시
- **테스트 단계**:
  1. "결과 복사" 버튼 클릭
  2. 클립보드에 복사됨 확인 (토스트 메시지)
  3. 버튼 아이콘 "Copy" → "Check"로 변경 확인
  4. 2초 후 원래 아이콘으로 복구 확인
- **기대 결과**:
  - 마크다운 전체 텍스트 클립보드 복사
  - 성공 토스트 메시지 표시
  - 아이콘 변경 애니메이션

**TC-RESULT-005: 목록으로 네비게이션**
- **전제 조건**: 분석 상세 페이지 표시
- **테스트 단계**:
  1. "목록으로" 버튼 클릭
  2. 대시보드 페이지로의 이동 확인
- **기대 결과**:
  - `/dashboard`로 이동

**TC-RESULT-006: 새 검사하기 네비게이션**
- **전제 조건**: 분석 상세 페이지 표시, 잔여 검사 횟수 1회 이상
- **테스트 단계**:
  1. "새 검사하기" 버튼 클릭
  2. 새 분석 페이지로의 이동 확인
- **기대 결과**:
  - `/dashboard/new`로 이동

**TC-RESULT-007: 타인의 분석 접근 시도 - 404**
- **전제 조건**: 로그인 상태, 다른 사용자의 분석 ID
- **테스트 단계**:
  1. URL에 다른 사용자의 분석 ID 입력하여 접근 시도
  2. 404 페이지 표시 여부 확인
- **기대 결과**:
  - 404 페이지 표시 (정보 노출 방지)

#### 1.4.3 테스트 케이스 파일

**파일**: `tests/e2e/result-detail.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Analysis Result Detail Page', () => {
  test('should display analysis result information', async ({ page }) => {
    // TC-RESULT-001
    // Requires: existing analysis in database

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click first result
    const resultCard = page.locator('[role="button"]:has-text(/\\d{4}-\\d{2}-\\d{2}/)').first();
    await resultCard.click();

    await page.waitForLoadState('networkidle');

    // Verify information displayed
    const name = page.locator('text=/[가-힣]+/').first();
    const birthDate = page.locator('text=/\\d{4}-\\d{2}-\\d{2}/');
    const analysiContent = page.locator('text=/##/'); // Markdown heading

    await expect(name).toBeVisible();
    await expect(birthDate).toBeVisible();
    await expect(analysiContent).toBeVisible();
  });

  test('should display Pro analysis badge and message', async ({ page }) => {
    // TC-RESULT-002
    // Requires: Pro model analysis result

    await page.goto('/dashboard');

    // Navigate to Pro result (need to find/create)
    const proResult = page.locator('[data-model="pro"]').first();
    if (await proResult.isVisible()) {
      await proResult.click();

      await page.waitForLoadState('networkidle');

      const proBadge = page.locator('text=/Pro 고급 분석/');
      const proMessage = page.locator('text=/Pro 구독으로 생성된 고급 분석/i');

      await expect(proBadge).toBeVisible();
      await expect(proMessage).toBeVisible();
    }
  });

  test('copy button should copy result to clipboard', async ({ page }) => {
    // TC-RESULT-004
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const resultCard = page.locator('[role="button"]').first();
    await resultCard.click();

    await page.waitForLoadState('networkidle');

    // Get clipboard permission and click copy
    const copyButton = page.locator('button:has-text("결과 복사")');
    await copyButton.click();

    // Check for success toast
    const successToast = page.locator('text=/복사되었습니다/i');
    await expect(successToast).toBeVisible();

    // Check icon change
    const checkIcon = copyButton.locator('svg');
    // (Visual check would require screenshot comparison)
  });

  test('should navigate to dashboard on back button', async ({ page }) => {
    // TC-RESULT-005
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const resultCard = page.locator('[role="button"]').first();
    await resultCard.click();

    await page.waitForLoadState('networkidle');

    const backButton = page.locator('button:has-text("목록으로")');
    await backButton.click();

    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should show 404 when accessing other user result', async ({ page }) => {
    // TC-RESULT-007
    // Need to have another user's analysis ID

    const fakeId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/dashboard/results/${fakeId}`);

    // Should show 404 page
    const notFoundText = page.locator('text=/404|찾을 수 없습니다/i');
    await expect(notFoundText).toBeVisible();
  });
});
```

---

### 1.5 구독 관리 페이지 (/subscription)

#### 1.5.1 테스트 목적
- 구독 상태별 정보 표시 확인
- 토스페이먼츠 SDK 결제 플로우 검증
- 구독 취소/재개 기능 확인
- 구독 상태 실시간 업데이트 검증

#### 1.5.2 테스트 시나리오

**TC-SUB-001: 무료 사용자 구독 버튼**
- **전제 조건**: 무료 사용자 로그인
- **테스트 단계**:
  1. 구독 관리 페이지 접근
  2. 무료 요금제 정보 확인
  3. "Pro 구독하기" 버튼 표시 확인
  4. 버튼 클릭 시 토스페이먼츠 SDK 호출 확인
- **기대 결과**:
  - "Pro 구독하기" 버튼 표시
  - 클릭 시 토스페이먼츠 결제창 열림

**TC-SUB-002: Pro 사용자 - 구독 정보 표시**
- **전제 조건**: Pro 구독 사용자 로그인
- **테스트 단계**:
  1. 구독 관리 페이지 접근
  2. 다음 정보 확인:
     - Pro 요금제 배지
     - 잔여 검사 횟수 (10회 이하)
     - 다음 결제일
     - 구독 시작일
     - 카드 정보 (뒷자리 4자리)
  3. "구독 취소" 버튼 표시 확인
- **기대 결과**:
  - 모든 구독 정보 명확히 표시
  - "구독 취소" 버튼 표시

**TC-SUB-003: Pro 사용자 - 구독 취소**
- **전제 조건**: Pro 구독 사용자 로그인
- **테스트 단계**:
  1. 구독 관리 페이지 접근
  2. "구독 취소" 버튼 클릭
  3. 확인 다이얼로그 표시 확인
  4. "확인" 클릭
  5. 페이지 리로드 및 상태 업데이트 확인
- **기대 결과**:
  - 다이얼로그: "구독을 취소하시겠습니까?"
  - 취소 완료 시 "Pro (취소 예약)" 상태로 변경
  - "구독 재개" 버튼 표시

**TC-SUB-004: Pro 사용자 (취소 예약) - 구독 재개**
- **전제 조건**: Pro 구독 (취소 예약) 상태 사용자
- **테스트 단계**:
  1. 구독 관리 페이지 접근
  2. "취소 예약" 배지 확인
  3. "구독 재개" 버튼 클릭
  4. 확인 다이얼로그 표시 확인
  5. "확인" 클릭
  6. 페이지 리로드 및 상태 업데이트 확인
- **기대 결과**:
  - 다이얼로그: "구독을 재개하시겠습니까?"
  - 재개 완료 시 "Pro" 상태로 변경
  - "구독 취소" 버튼 표시

**TC-SUB-005: 결제 실패 상태 표시**
- **전제 조건**: Pro 구독 (결제 실패) 상태 사용자
- **테스트 단계**:
  1. 구독 관리 페이지 접근
  2. 결제 실패 배지 확인
  3. 결제 실패 안내 메시지 확인
  4. "결제 재시도" 버튼 표시 확인
- **기대 결과**:
  - 빨간색 "결제 실패" 배지
  - 안내 메시지 명확히 표시
  - "결제 재시도" 버튼 표시

#### 1.5.3 테스트 케이스 파일

**파일**: `tests/e2e/subscription.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Subscription Management Page', () => {
  test('free user should see subscribe button', async ({ page }) => {
    // TC-SUB-001
    // Requires: authenticated free user

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const subscribeButton = page.locator('button:has-text("Pro 구독하기")');
    await expect(subscribeButton).toBeVisible();

    const planBadge = page.locator('text=/무료 요금제/');
    await expect(planBadge).toBeVisible();
  });

  test('pro user should see subscription info', async ({ page }) => {
    // TC-SUB-002
    // Requires: authenticated Pro user

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const proBadge = page.locator('text=/Pro 요금제/');
    const nextBillingDate = page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일/');
    const cancelButton = page.locator('button:has-text("구독 취소")');

    await expect(proBadge).toBeVisible();
    await expect(nextBillingDate).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('pro user should be able to cancel subscription', async ({ page }) => {
    // TC-SUB-003
    // Requires: authenticated Pro user

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("구독 취소")');
    await cancelButton.click();

    // Confirm dialog
    const confirmButton = page.locator('button:has-text("확인")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for update
    await page.waitForTimeout(2000);

    // Check for cancelled badge
    const cancelledBadge = page.locator('text=/취소 예약/');
    await expect(cancelledBadge).toBeVisible();

    // Check for resume button
    const resumeButton = page.locator('button:has-text("구독 재개")');
    await expect(resumeButton).toBeVisible();
  });

  test('cancelled user should be able to resume subscription', async ({ page }) => {
    // TC-SUB-004
    // Requires: authenticated Pro user (cancelled)

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const resumeButton = page.locator('button:has-text("구독 재개")');
    await resumeButton.click();

    // Confirm dialog
    const confirmButton = page.locator('button:has-text("확인")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for update
    await page.waitForTimeout(2000);

    // Check for active Pro state
    const proBadge = page.locator('text=/Pro 요금제(?!.*취소)/');
    await expect(proBadge).toBeVisible();
  });

  test('payment failed user should see retry button', async ({ page }) => {
    // TC-SUB-005
    // Requires: Pro user with payment_failed status

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const failedBadge = page.locator('text=/결제 실패/');
    const retryButton = page.locator('button:has-text("결제 재시도")');
    const errorMessage = page.locator('text=/결제에 실패했습니다/i');

    await expect(failedBadge).toBeVisible();
    await expect(retryButton).toBeVisible();
    await expect(errorMessage).toBeVisible();
  });
});
```

---

## 2. 통합 E2E 테스트 시나리오

### 2.1 전체 사용자 플로우 (무료 → Pro 구독 → 분석)

**TC-FLOW-001: 무료 사용자 → Pro 구독 → 새 분석 → 상세 조회**

```typescript
test('complete flow: free user -> subscribe -> new analysis -> view result', async ({ page }) => {
  // 1. 홈 페이지 방문 (비로그인)
  await page.goto('/');

  // 2. 로그인 (Clerk 모달)
  const startButton = page.locator('button:has-text("무료로 시작하기")');
  await startButton.click();
  // 로그인 진행...

  // 3. 대시보드 (이력 없음)
  await page.waitForURL('/dashboard');
  const emptyState = page.locator('text=/아직 사주분석 이력이 없습니다/i');
  await expect(emptyState).toBeVisible();

  // 4. 구독 관리 페이지
  const subscriptionLink = page.locator('a[href="/subscription"]');
  await subscriptionLink.click();
  await page.waitForURL('/subscription');

  // 5. Pro 구독
  const subscribeButton = page.locator('button:has-text("Pro 구독하기")');
  await subscribeButton.click();
  // 토스페이먼츠 결제...

  // 6. 새 분석
  const newAnalysisLink = page.locator('a[href="/dashboard/new"]');
  await newAnalysisLink.click();
  await page.waitForURL('/dashboard/new');

  // 7. 폼 작성 및 제출
  await page.locator('input[name="name"]').fill('테스트사용자');
  await page.locator('input[name="birthDate"]').fill('1990-01-01');
  await page.locator('input[value="male"]').click();

  const submitButton = page.locator('button:has-text("검사 시작")');
  await submitButton.click();

  // 8. 분석 진행 중
  const spinner = page.locator('[role="status"]');
  await expect(spinner).toBeVisible();

  // 9. 결과 페이지
  await page.waitForURL(/\/dashboard\/results\/.+/);

  // 10. 결과 확인
  const resultContent = page.locator('text=/##/'); // Markdown
  await expect(resultContent).toBeVisible();

  // 11. 목록으로 돌아가기
  const backButton = page.locator('button:has-text("목록으로")');
  await backButton.click();
  await page.waitForURL('/dashboard');

  // 12. 대시보드에서 방금 생성한 분석 확인
  const newResult = page.locator('text=/테스트사용자/');
  await expect(newResult).toBeVisible();
});
```

---

## 3. 테스트 실행 및 보고

### 3.1 테스트 실행 명령

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# 특정 페이지만 테스트
npm run test:e2e -- home.spec.ts
npm run test:e2e -- dashboard.spec.ts
npm run test:e2e -- new-analysis.spec.ts
npm run test:e2e -- result-detail.spec.ts
npm run test:e2e -- subscription.spec.ts

# UI 모드로 실행
npm run test:e2e -- --ui

# 브라우저 선택하여 실행
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
```

### 3.2 테스트 결과 리포팅

테스트 완료 후 `/prompts/e2e-test-results.md` 파일에 다음 내용 기록:

- 테스트 실행 날짜/시간
- 전체 테스트 케이스 수
- 통과 수 / 실패 수 / 스킵 수
- 실패한 테스트 상세 내용
- 성능 지표 (평균 실행 시간, 가장 느린 테스트)
- 주의사항 및 개선점

---

## 4. 주의사항

### 4.1 테스트 환경 준비

- Supabase 로컬 에뮬레이터 실행: `supabase start`
- 테스트용 사용자 계정 미리 생성
- 테스트용 사주분석 데이터 준비
- Clerk 테스트 계정 설정

### 4.2 테스트 격리

- 각 테스트 케이스는 독립적으로 실행 가능
- 테스트 순서에 무관하게 동작
- 테스트 후 데이터 정리 (cleanUp)

### 4.3 실패 시 대응

- 스크린샷 자동 저장 검토
- 비디오 기록 확인
- 네트워크 활동 로그 분석
- 콘솔 에러 메시지 확인

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-30 | Claude Code | 초안 작성 - 5개 페이지별 E2E 테스트 계획 |

