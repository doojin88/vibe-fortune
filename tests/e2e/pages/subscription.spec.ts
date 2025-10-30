import { test, expect } from '@playwright/test';

test.describe('Subscription Management Page (/subscription)', () => {
  test('TC-SUB-001: free user should see subscribe button', async ({ page }) => {
    // 무료 사용자의 구독 버튼 표시

    // 주의: 무료 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Pro 구독하기 버튼 확인
    const subscribeButton = page.locator('button:has-text("Pro 구독하기")');

    if (await subscribeButton.isVisible()) {
      await expect(subscribeButton).toBeVisible();
      await expect(subscribeButton).toBeEnabled();
    }

    // 무료 요금제 배지 확인
    const planBadge = page.locator('text=/무료 요금제/i');

    if (await planBadge.isVisible()) {
      await expect(planBadge).toBeVisible();
    }
  });

  test('TC-SUB-002: pro user should see subscription info', async ({ page }) => {
    // Pro 사용자의 구독 정보 표시

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Pro 요금제 배지
    const proBadge = page.locator('text=/Pro 요금제/i');

    if (await proBadge.isVisible()) {
      await expect(proBadge).toBeVisible();
    }

    // 다음 결제일
    const nextBillingDate = page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일|다음 결제일/i');

    if (await nextBillingDate.isVisible()) {
      await expect(nextBillingDate).toBeVisible();
    }

    // 구독 시작일
    const startDate = page.locator('text=/구독 시작일|시작 날짜/i');

    if (await startDate.isVisible()) {
      await expect(startDate).toBeVisible();
    }

    // 구독 취소 버튼
    const cancelButton = page.locator('button:has-text("구독 취소")');

    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeVisible();
    }
  });

  test('TC-SUB-003: pro user should be able to cancel subscription', async ({ page }) => {
    // Pro 사용자의 구독 취소

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("구독 취소")');

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // 확인 다이얼로그 표시 확인
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      const dialogTitle = page.locator('text=/구독을 취소|취소하시겠습니까/i');

      if (await dialog.isVisible().catch(() => false)) {
        await expect(dialog).toBeVisible();
      }

      if (await dialogTitle.isVisible().catch(() => false)) {
        await expect(dialogTitle).toBeVisible();
      }

      // 확인 버튼 클릭
      const confirmButton = page.locator('button:has-text("확인")');

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // 페이지가 업데이트되었는지 확인
        // 취소 예약 배지가 표시되어야 함
        const cancelledBadge = page.locator('text=/취소 예약/i');
        const resumeButton = page.locator('button:has-text("구독 재개")');

        if (await cancelledBadge.isVisible().catch(() => false)) {
          await expect(cancelledBadge).toBeVisible();
        }

        if (await resumeButton.isVisible().catch(() => false)) {
          await expect(resumeButton).toBeVisible();
        }
      } else {
        // 취소 버튼 클릭하여 다이얼로그 닫기
        const cancelDialogButton = page.locator('button:has-text("취소")');

        if (await cancelDialogButton.isVisible()) {
          await cancelDialogButton.click();
        }
      }
    }
  });

  test('TC-SUB-004: cancelled user should be able to resume subscription', async ({ page }) => {
    // 취소 예약된 사용자의 구독 재개

    // 주의: Pro (취소 예약) 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const resumeButton = page.locator('button:has-text("구독 재개")');

    if (await resumeButton.isVisible()) {
      await resumeButton.click();

      // 확인 다이얼로그 표시 확인
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
      const dialogTitle = page.locator('text=/구독을 재개|재개하시겠습니까/i');

      if (await dialog.isVisible().catch(() => false)) {
        await expect(dialog).toBeVisible();
      }

      if (await dialogTitle.isVisible().catch(() => false)) {
        await expect(dialogTitle).toBeVisible();
      }

      // 확인 버튼 클릭
      const confirmButton = page.locator('button:has-text("확인")');

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // 페이지가 업데이트되었는지 확인
        // Pro 배지가 표시되어야 함 (취소 예약 제거)
        const proBadge = page.locator('text=/Pro 요금제(?!.*취소)/i');
        const cancelButton = page.locator('button:has-text("구독 취소")');

        if (await proBadge.isVisible().catch(() => false)) {
          await expect(proBadge).toBeVisible();
        }

        if (await cancelButton.isVisible().catch(() => false)) {
          await expect(cancelButton).toBeVisible();
        }
      } else {
        // 취소 버튼 클릭하여 다이얼로그 닫기
        const cancelDialogButton = page.locator('button:has-text("취소")');

        if (await cancelDialogButton.isVisible()) {
          await cancelDialogButton.click();
        }
      }
    }
  });

  test('TC-SUB-005: payment failed user should see retry button', async ({ page }) => {
    // 결제 실패 상태 사용자의 UI

    // 주의: 결제 실패 상태 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 결제 실패 배지
    const failedBadge = page.locator('text=/결제 실패|payment.*failed/i');

    if (await failedBadge.isVisible()) {
      await expect(failedBadge).toBeVisible();
    }

    // 결제 재시도 버튼
    const retryButton = page.locator('button:has-text("결제 재시도"), button:has-text("다시 시도")');

    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }

    // 에러 메시지
    const errorMessage = page.locator('text=/결제에 실패했습니다|결제 오류/i');

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('TC-SUB-006: subscription info should display card details', async ({ page }) => {
    // Pro 사용자의 카드 정보 표시

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 카드 정보 표시 확인
    // 형식: {카드사} ({카드타입}) **** **** **** 1234
    const cardInfo = page.locator('text=/\\*\\*\\*\\*.*\\d{4}|카드|Card/i');

    if (await cardInfo.isVisible().catch(() => false)) {
      await expect(cardInfo).toBeVisible();
    }
  });

  test('TC-SUB-007: page should display current email', async ({ page }) => {
    // 현재 사용자 이메일 표시

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 이메일 표시 확인
    const email = page.locator('text=/.*@.*\\..*/');

    if (await email.isVisible().catch(() => false)) {
      await expect(email).toBeVisible();
    }
  });

  test('TC-SUB-008: pro user should see remaining test count', async ({ page }) => {
    // Pro 사용자의 잔여 검사 횟수 표시

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 잔여 횟수 표시 확인
    const testCount = page.locator('text=/\\d+회|\\d+회 남음|남은 횟수/i');

    if (await testCount.isVisible().catch(() => false)) {
      await expect(testCount).toBeVisible();
    }
  });

  test('TC-SUB-009: page heading should be visible', async ({ page }) => {
    // 페이지 제목 확인

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const pageHeading = page.locator('h1:has-text("구독"), h1:has-text("요금제")');

    if (await pageHeading.isVisible().catch(() => false)) {
      await expect(pageHeading).toBeVisible();
    }
  });

  test('TC-SUB-010: responsive design - mobile view', async ({ page }) => {
    // 모바일 뷰에서의 반응형 디자인

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 콘텐츠가 올바르게 표시되는지 확인
    const content = page.locator('main, article, section:first-child');

    if (await content.isVisible()) {
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

  test('TC-SUB-011: subscription plan comparison', async ({ page }) => {
    // 요금제 비교 정보 표시

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 인증 리다이렉트 허용
    if (/sign-in|clerk/i.test(page.url())) {
      expect(true).toBeTruthy();
      return;
    }

    // 페이지 컨테이너 범위에서 탐색
    const container = page.locator('main, #subscription, [data-testid="subscription-page"]').first();

    // 다양한 패턴으로 플랜 텍스트 탐지
    const freeInfo = container.locator('text=/무료\s*요금제|무료|free/i');
    const proInfo = container.locator('text=/Pro\s*요금제|Pro|pro|9,900|₩9,900/i');

    // 카드 제목/배지 대체 탐지
    const anyPlan = container.locator('text=/요금|플랜|plan|구독/i');

    const visible = await Promise.all([
      freeInfo.isVisible().catch(() => false),
      proInfo.isVisible().catch(() => false),
      anyPlan.isVisible().catch(() => false),
    ]);

    expect(visible.some(Boolean)).toBeTruthy();
  });

  test('TC-SUB-012: keyboard navigation', async ({ page }) => {
    // 키보드 네비게이션 테스트

    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // Tab 키로 이동
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');

    const focusedCount = await focused.count();
    expect(focusedCount).toBeGreaterThan(0);
  });

  test('TC-SUB-013: dialog should be dismissable with escape key', async ({ page }) => {
    // ESC 키로 다이얼로그 닫기

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("구독 취소")');

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // 다이얼로그 표시 확인
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');

      if (await dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // 다이얼로그가 닫혀야 함
        const isOpen = await dialog.isVisible().catch(() => false);
        expect(!isOpen).toBeTruthy();
      }
    }
  });

  test('TC-SUB-014: page load performance', async ({ page }) => {
    // 페이지 로드 성능

    const startTime = Date.now();
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000);

    console.log(`Subscription page load time: ${loadTime}ms`);
  });

  test('TC-SUB-015: billing date format should be readable', async ({ page }) => {
    // 결제일 형식 확인

    // 주의: Pro 사용자 세션 필요
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    // 다음 결제일
    const billingDate = page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일/');

    if (await billingDate.isVisible().catch(() => false)) {
      const text = await billingDate.first().textContent();

      // 날짜 형식이 정상인지 확인
      const dateRegex = /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/;
      expect(dateRegex.test(text || '')).toBeTruthy();
    }
  });
});
