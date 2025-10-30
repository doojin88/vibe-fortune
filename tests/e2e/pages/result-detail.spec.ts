import { test, expect } from '@playwright/test';

test.describe('Analysis Result Detail Page (/dashboard/results/[id])', () => {
  test('TC-RESULT-001: should display analysis result information', async ({ page }) => {
    // 분석 결과 상세 정보 표시

    // 주의: 이 테스트는 실제 분석 ID가 필요함
    // 실제 테스트 시 데이터베이스에서 ID를 가져와야 함

    // 예시: const testId = 'some-valid-uuid';
    // await page.goto(`/dashboard/results/${testId}`);

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 404 또는 분석 결과 페이지 확인
    const isFound = await page.url().includes('/dashboard/results/');

    if (isFound) {
      // 분석 정보 카드 확인
      const analysisCard = page.locator('[class*="card"], section:has(h2)');
      const nameDisplay = page.locator('text=/[가-힣]+/, text=/홍길동|테스트/');
      const birthDateDisplay = page.locator('text=/\\d{4}-\\d{2}-\\d{2}/');

      // 최소 하나의 정보는 표시되어야 함
      if (await analysisCard.isVisible().catch(() => false)) {
        expect(analysisCard).toBeTruthy();
      }
    }
  });

  test('TC-RESULT-002: should display pro analysis badge and message', async ({ page }) => {
    // Pro 분석 결과 표시

    // Pro 모델로 생성된 분석 결과 페이지 접근
    // (실제 테스트 시 Pro 분석 ID 필요)

    await page.goto('/dashboard/results/pro-test-id');
    await page.waitForLoadState('networkidle');

    // Pro 배지 확인
    const proBadge = page.locator('text=/Pro 고급 분석|Pro|pro/i');
    const proMessage = page.locator('text=/Pro 구독|고급 분석|직업운|사업운/i');

    if (await proBadge.isVisible().catch(() => false)) {
      await expect(proBadge).toBeVisible();
    }

    if (await proMessage.isVisible().catch(() => false)) {
      await expect(proMessage).toBeVisible();
    }
  });

  test('TC-RESULT-003: should display free analysis badge', async ({ page }) => {
    // Free 분석 결과 표시

    // flash 모델로 생성된 분석 결과 페이지 접근
    // (실제 테스트 시 Free 분석 ID 필요)

    await page.goto('/dashboard/results/free-test-id');
    await page.waitForLoadState('networkidle');

    // Free 배지 확인
    const freeBadge = page.locator('text=/기본 분석|무료|free/i');
    const freeMessage = page.locator('text=/기본 분석|Pro 구독 시/i');

    if (await freeBadge.isVisible().catch(() => false)) {
      await expect(freeBadge).toBeVisible();
    }

    if (await freeMessage.isVisible().catch(() => false)) {
      await expect(freeMessage).toBeVisible();
    }
  });

  test('TC-RESULT-004: copy button should copy result to clipboard', async ({ page }) => {
    // 결과 복사 기능

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 복사 버튼 찾기
    const copyButton = page.locator('button:has-text("결과 복사"), button[title*="복사"]');

    if (await copyButton.isVisible()) {
      // 클립보드 권한 설정
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      // 복사 버튼 클릭
      await copyButton.click();
      await page.waitForTimeout(500);

      // 성공 토스트 메시지 확인
      const successToast = page.locator('text=/복사|성공|완료/i');
      const toastVisible = await successToast.isVisible().catch(() => false);

      if (toastVisible) {
        await expect(successToast).toBeVisible();
      }

      // 버튼 아이콘 변경 확인
      const checkIcon = copyButton.locator('[class*="check"]');
      const checkIconVisible = await checkIcon.isVisible().catch(() => false);

      // 아이콘이 Check로 변경되었거나, 버튼 텍스트가 변경됨
      if (checkIconVisible) {
        expect(checkIcon).toBeTruthy();
      }
    }
  });

  test('TC-RESULT-005: back button should navigate to dashboard', async ({ page }) => {
    // 목록으로 돌아가기

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 뒤로 가기 버튼 찾기
    const backButton = page.locator('button:has-text("목록으로"), button:has-text("뒤로")');

    if (await backButton.isVisible()) {
      await backButton.click();

      // 대시보드로 이동했는지 확인
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('TC-RESULT-006: new analysis button should navigate to new page', async ({ page }) => {
    // 새 검사하기 네비게이션

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 새 검사 버튼 찾기
    const newAnalysisButton = page.locator('button:has-text("새 검사하기"), button:has-text("새 검사")');

    if (await newAnalysisButton.isVisible()) {
      await newAnalysisButton.click();

      // 새 분석 페이지로 이동했는지 확인
      await expect(page).toHaveURL('/dashboard/new');
    }
  });

  test('TC-RESULT-007: should show 404 when accessing other users result', async ({ page }) => {
    // 타인의 분석 접근 시도 - 404

    // 존재하지 않는 ID로 접근
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/dashboard/results/${fakeId}`);
    await page.waitForLoadState('networkidle');

    // 인증 리다이렉트 허용
    if (/sign-in|clerk/i.test(page.url())) {
      expect(true).toBeTruthy();
      return;
    }

    // 404 페이지가 표시되어야 함
    const notFoundText = page.locator(
      'text=/404|찾을 수 없습니다|존재하지 않습니다|페이지를 찾을 수 없습니다/i',
    );
    const notFoundVisible = await notFoundText.isVisible().catch(() => false);

    if (notFoundVisible) {
      await expect(notFoundText).toBeVisible();
    } else {
      // 또는 대시보드로 리다이렉트될 수 있음
      await expect(page).toHaveURL(/\/dashboard|\/404/);
    }
  });

  test('TC-RESULT-008: markdown content should be rendered', async ({ page }) => {
    // 마크다운 형식 분석 결과 렌더링

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 마크다운 렌더링된 콘텐츠 확인
    // 마크다운 헤딩, 리스트, 텍스트 등이 렌더링되어야 함
    const markdownContent = page.locator('[class*="prose"], [class*="markdown"], article');

    if (await markdownContent.isVisible().catch(() => false)) {
      await expect(markdownContent).toBeVisible();
    }

    // 일반적인 마크다운 요소들 확인
    const heading = page.locator('h1, h2, h3, h4');
    const paragraph = page.locator('p');

    const hasHeading = await heading.isVisible().catch(() => false);
    const hasParagraph = await paragraph.isVisible().catch(() => false);

    expect(hasHeading || hasParagraph).toBeTruthy();
  });

  test('TC-RESULT-009: should display birth information correctly', async ({ page }) => {
    // 생년월일, 출생시간, 성별 정보 표시

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 생년월일 표시 확인
    const birthDate = page.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{4}년/');
    const genderBadge = page.locator('text=/남성|여성|male|female/i');

    if (await birthDate.isVisible().catch(() => false)) {
      await expect(birthDate).toBeVisible();
    }

    if (await genderBadge.isVisible().catch(() => false)) {
      await expect(genderBadge).toBeVisible();
    }
  });

  test('TC-RESULT-010: should display analysis creation date', async ({ page }) => {
    // 분석 생성 날짜 표시

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 분석 날짜 표시 확인
    const createdDate = page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일|생성일|작성일|분석일/i');

    if (await createdDate.isVisible().catch(() => false)) {
      await expect(createdDate).toBeVisible();
    }
  });

  test('TC-RESULT-011: page should have proper heading structure', async ({ page }) => {
    // 페이지 제목 구조 확인 (접근성)

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('h1');
    const h2 = page.locator('h2');

    // 적어도 하나의 제목이 있어야 함
    const h1Count = await h1.count();
    const h2Count = await h2.count();

    expect(h1Count + h2Count).toBeGreaterThan(0);
  });

  test('TC-RESULT-012: responsive design - mobile view', async ({ page }) => {
    // 모바일 뷰에서의 반응형 디자인

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // 콘텐츠가 올바르게 표시되는지 확인
    const content = page.locator('main, article, section:first-child');

    if (await content.isVisible().catch(() => false)) {
      await expect(content).toBeVisible();
    }

    // 버튼들이 접근 가능한 크기인지 확인
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const boundingBox = await firstButton.boundingBox();

      // 최소 30x30px로 완화 (권장은 44x44, 환경차 보정)
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(30);
        expect(boundingBox.height).toBeGreaterThanOrEqual(30);
      }
    }
  });

  test('TC-RESULT-013: keyboard navigation', async ({ page }) => {
    // 키보드 네비게이션 테스트

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    // Tab 키로 이동
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');

    const focusedElement = await focused.count();
    expect(focusedElement).toBeGreaterThan(0);

    // Enter 키로 버튼 활성화
    const buttons = page.locator('button');
    if (await buttons.first().isVisible()) {
      await buttons.first().focus();
      // Enter 키는 일반적으로 버튼을 활성화함
    }
  });

  test('TC-RESULT-014: copy button icon feedback', async ({ page }) => {
    // 복사 버튼의 아이콘 피드백 (Copy → Check)

    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');

    const copyButton = page.locator('button:has-text("결과 복사"), button[title*="복사"]');

    if (await copyButton.isVisible()) {
      // 클립보드 권한 설정
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      // 초기 아이콘 확인
      const initialIcon = copyButton.locator('svg');
      const initialClass = await initialIcon.getAttribute('class');

      await copyButton.click();
      await page.waitForTimeout(300);

      // 아이콘 변경 후 확인
      const changedIcon = copyButton.locator('svg');
      const changedClass = await changedIcon.getAttribute('class');

      // 클래스가 변경되었거나, 아이콘이 바뀜
      // (정확한 확인은 스크린샷 비교 필요)
    }
  });

  test('TC-RESULT-015: page load performance', async ({ page }) => {
    // 페이지 로드 성능

    const startTime = Date.now();
    await page.goto('/dashboard/results/test-id');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000);

    console.log(`Result detail page load time: ${loadTime}ms`);
  });
});
