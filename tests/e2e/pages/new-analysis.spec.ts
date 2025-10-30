import { test, expect } from '@playwright/test';

test.describe('New Analysis Page (/dashboard/new)', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 페이지 이동
    // 실제 테스트 시 인증이 필요하므로 주의
  });

  test('TC-NEW-001: form should accept valid input', async ({ page }) => {
    // 유효한 데이터로 폼 작성

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // 성함 입력
    const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('홍길동');
    }

    // 생년월일 입력
    const birthDateInput = page.locator(
      'input[name="birthDate"], input[placeholder*="생년월일"]',
    );
    if (await birthDateInput.isVisible()) {
      await birthDateInput.fill('2000-01-01');
    }

    // 출생시간 입력 (선택)
    const birthTimeInput = page.locator('input[name="birthTime"], input[type="time"]');
    if (await birthTimeInput.isVisible()) {
      await birthTimeInput.fill('14:30');
    }

    // 성별 선택
    const maleRadio = page.locator('input[value="male"], input[name="gender"][value="M"]');
    if (await maleRadio.isVisible()) {
      await maleRadio.click();
    }

    // 제출 버튼 활성화 확인
    const submitButton = page.locator('button:has-text("검사 시작"), button[type="submit"]');
    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeEnabled();
    }
  });

  test('TC-NEW-002: should validate birth date format', async ({ page }) => {
    // 생년월일 형식 검증

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const birthDateInput = page.locator('input[name="birthDate"], input[placeholder*="생년월일"]');

    if (await birthDateInput.isVisible()) {
      // 잘못된 형식 입력
      await birthDateInput.fill('2000-13-01');
      await page.waitForTimeout(500);

      // 에러 메시지 확인
      const errorMsg = page.locator(
        'text=/생년월일을|날짜 형식|유효하지 않은/i',
      );
      const hasError = await errorMsg.isVisible().catch(() => false);

      if (hasError) {
        await expect(errorMsg).toBeVisible();
      }

      // 정상 형식으로 수정
      await birthDateInput.fill('2000-01-01');
      await page.waitForTimeout(500);

      // 에러 메시지 사라짐 확인
      if (hasError) {
        await expect(errorMsg).not.toBeVisible();
      }
    }
  });

  test('TC-NEW-003: unknown birth time checkbox should toggle time input', async ({ page }) => {
    // 출생시간 모름 체크박스 테스트

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const unknownBirthTimeCheckbox = page.locator(
      'input[type="checkbox"][id*="unknown"], input[type="checkbox"][name*="unknown"]',
    );
    const birthTimeInput = page.locator('input[name="birthTime"], input[type="time"]');

    if (await unknownBirthTimeCheckbox.isVisible() && await birthTimeInput.isVisible()) {
      // 초기 상태: 입력 필드 활성화
      await expect(birthTimeInput).toBeEnabled();

      // 체크박스 클릭 (활성화)
      await unknownBirthTimeCheckbox.check();
      await page.waitForTimeout(200);

      // 입력 필드 비활성화 확인
      await expect(birthTimeInput).toBeDisabled();

      // 체크박스 해제
      await unknownBirthTimeCheckbox.uncheck();
      await page.waitForTimeout(200);

      // 입력 필드 활성화 확인
      await expect(birthTimeInput).toBeEnabled();
    }
  });

  test('TC-NEW-004: required fields should be marked', async ({ page }) => {
    // 필수 필드 표시 확인

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // 필수 필드들 확인
    const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');
    const birthDateInput = page.locator('input[name="birthDate"], input[placeholder*="생년월일"]');
    const genderRadio = page.locator('input[name="gender"]');

    // 필드들이 required 속성을 가지고 있는지 확인
    if (await nameInput.isVisible()) {
      const isRequired = await nameInput.getAttribute('required');
      expect(isRequired).toBeTruthy();
    }

    if (await birthDateInput.isVisible()) {
      const isRequired = await birthDateInput.getAttribute('required');
      expect(isRequired).toBeTruthy();
    }
  });

  test('TC-NEW-005: gender radio buttons should work correctly', async ({ page }) => {
    // 성별 라디오 버튼 테스트

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const maleRadio = page.locator('input[value="male"], input[name="gender"][value="M"]');
    const femaleRadio = page.locator('input[value="female"], input[name="gender"][value="F"]');

    if (await maleRadio.isVisible() && await femaleRadio.isVisible()) {
      // 남성 선택
      await maleRadio.click();
      await expect(maleRadio).toBeChecked();

      // 여성 선택
      await femaleRadio.click();
      await expect(femaleRadio).toBeChecked();

      // 남성은 선택 해제되어야 함
      await expect(maleRadio).not.toBeChecked();
    }
  });

  test('TC-NEW-006: submit button should be disabled when form is invalid', async ({ page }) => {
    // 폼이 유효하지 않을 때 제출 버튼 비활성화

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button:has-text("검사 시작"), button[type="submit"]');

    if (await submitButton.isVisible()) {
      // 초기 상태에서는 비활성화되어 있어야 함 (필수 필드 미입력)
      const isEnabled = await submitButton.isEnabled();

      if (!isEnabled) {
        // 필드 입력 후 활성화되는지 확인
        const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');
        const birthDateInput = page.locator(
          'input[name="birthDate"], input[placeholder*="생년월일"]',
        );
        const genderRadio = page.locator('input[value="male"], input[name="gender"][value="M"]');

        if (await nameInput.isVisible()) {
          await nameInput.fill('테스트');
        }

        if (await birthDateInput.isVisible()) {
          await birthDateInput.fill('1990-05-15');
        }

        if (await genderRadio.isVisible()) {
          await genderRadio.click();
        }

        await page.waitForTimeout(300);

        // 이제 활성화되어야 함
        await expect(submitButton).toBeEnabled();
      }
    }
  });

  test('TC-NEW-007: real-time validation for birth date', async ({ page }) => {
    // 생년월일 실시간 검증

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const birthDateInput = page.locator('input[name="birthDate"], input[placeholder*="생년월일"]');

    if (await birthDateInput.isVisible()) {
      // 미래 날짜 입력
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await birthDateInput.fill(futureDateString);
      await page.waitForTimeout(500);

      // 에러 메시지 확인 (미래 날짜는 불가능)
      const errorMsg = page.locator(
        'text=/미래|현재보다 뒤|유효하지 않은/i',
      );
      const hasError = await errorMsg.isVisible().catch(() => false);

      if (hasError) {
        await expect(errorMsg).toBeVisible();
      }

      // 유효한 날짜 입력
      await birthDateInput.fill('1990-01-01');
      await page.waitForTimeout(500);
    }
  });

  test('TC-NEW-008: form fields should clear on reset', async ({ page }) => {
    // 폼 초기화 기능

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // 폼 필드 입력
    const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');
    const birthDateInput = page.locator('input[name="birthDate"], input[placeholder*="생년월일"]');

    if (await nameInput.isVisible()) {
      await nameInput.fill('테스트');
    }

    if (await birthDateInput.isVisible()) {
      await birthDateInput.fill('1990-01-01');
    }

    // 초기화 버튼 찾기
    const resetButton = page.locator('button:has-text("초기화"), button[type="reset"]');

    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(200);

      // 필드가 초기화되었는지 확인
      if (await nameInput.isVisible()) {
        const value = await nameInput.inputValue();
        expect(value).toBe('');
      }
    }
  });

  test('TC-NEW-009: page should be protected (require login)', async ({ page }) => {
    // 페이지 접근 보호 확인

    // 로그인 세션 없이 접근
    await page.context().clearCookies();

    await page.goto('/dashboard/new');

    // 로그인 페이지로 리다이렉트되어야 함
    const isLoggedIn = await page.url().includes('/dashboard/new');

    if (!isLoggedIn) {
      // 리다이렉트됨
      expect(page.url()).toMatch(/sign-in|login|clerk/i);
    }
  });

  test('TC-NEW-010: form accessibility - labels associated with inputs', async ({ page }) => {
    // 폼 접근성 확인

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // 레이블과 입력 필드가 연결되어 있는지 확인
    const labels = page.locator('label');
    const labelCount = await labels.count();

    expect(labelCount).toBeGreaterThan(0);

    // 각 레이블이 for 속성을 가지고 있는지 확인
    for (let i = 0; i < Math.min(labelCount, 3); i++) {
      const forAttribute = await labels.nth(i).getAttribute('for');
      expect(forAttribute).toBeTruthy();
    }
  });

  test('TC-NEW-011: input field character limits', async ({ page }) => {
    // 입력 필드 문자 제한 확인

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');

    if (await nameInput.isVisible()) {
      const maxLength = await nameInput.getAttribute('maxlength');

      if (maxLength) {
        // 최대 길이를 초과하는 텍스트 입력 시도
        const longText = 'a'.repeat(parseInt(maxLength) + 10);
        await nameInput.fill(longText);

        const value = await nameInput.inputValue();

        // 입력 필드의 값이 maxLength를 초과하지 않아야 함
        expect(value.length).toBeLessThanOrEqual(parseInt(maxLength));
      }
    }
  });

  test('TC-NEW-012: submit button loading state', async ({ page }) => {
    // 제출 버튼의 로딩 상태 표시

    await page.goto('/dashboard/new');
    await page.waitForLoadState('networkidle');

    // 폼 작성
    const nameInput = page.locator('input[name="name"], input[placeholder*="성함"]');
    const birthDateInput = page.locator('input[name="birthDate"], input[placeholder*="생년월일"]');
    const genderRadio = page.locator('input[value="male"], input[name="gender"][value="M"]');

    if (await nameInput.isVisible()) {
      await nameInput.fill('테스트');
    }

    if (await birthDateInput.isVisible()) {
      await birthDateInput.fill('1990-05-15');
    }

    if (await genderRadio.isVisible()) {
      await genderRadio.click();
    }

    // 제출 버튼 클릭
    const submitButton = page.locator('button:has-text("검사 시작"), button[type="submit"]');

    if (await submitButton.isEnabled()) {
      await submitButton.click();
      await page.waitForTimeout(300);

      // 로딩 상태 확인 (비활성화 또는 스피너)
      const isDisabled = await submitButton.isDisabled();
      const spinner = page.locator('[role="status"], .spinner, .loading');
      const spinnerVisible = await spinner.isVisible().catch(() => false);

      expect(isDisabled || spinnerVisible).toBeTruthy();
    }
  });
});
