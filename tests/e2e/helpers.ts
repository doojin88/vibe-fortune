import { Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * E2E 테스트 공통 헬퍼 함수 모음
 */

/**
 * Supabase 클라이언트 생성
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * 테스트용 사용자 데이터 생성
 */
export async function createTestUser() {
  const supabase = createSupabaseClient();

  const testUserId = `test-user-${Date.now()}`;
  const testEmail = `test-${Date.now()}@example.com`;

  // users 테이블에 테스트 사용자 추가
  const { data, error } = await supabase.from('users').insert({
    id: testUserId,
    email: testEmail,
    name: 'Test User',
    subscription_status: 'free',
    test_count: 3,
  });

  if (error) {
    console.error('Failed to create test user:', error);
    return null;
  }

  return { id: testUserId, email: testEmail };
}

/**
 * 테스트용 사주분석 데이터 생성
 */
export async function createTestAnalysis(userId: string) {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.from('analyses').insert({
    user_id: userId,
    name: '테스트사용자',
    birth_date: '1990-01-01',
    birth_time: '14:30',
    gender: 'male',
    analysis_result: '# 사주분석 결과\n\n이것은 테스트 분석 결과입니다.',
    model_used: 'flash',
  });

  if (error) {
    console.error('Failed to create test analysis:', error);
    return null;
  }

  return data;
}

/**
 * 테스트 데이터 정리
 */
export async function cleanupTestData(userId: string) {
  const supabase = createSupabaseClient();

  // analyses 테이블에서 사용자의 모든 분석 삭제
  await supabase.from('analyses').delete().eq('user_id', userId);

  // users 테이블에서 사용자 삭제
  await supabase.from('users').delete().eq('id', userId);
}

/**
 * 페이지 로드 완료 대기
 */
export async function waitForPageLoad(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 특정 요소가 보이는지 확인
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * 로그인 상태 확인
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // UserButton 또는 로그인된 사용자의 메뉴가 있는지 확인
  const userMenu = page.locator('[aria-label*="user"], [data-testid="user-button"]');
  return await userMenu.isVisible().catch(() => false);
}

/**
 * 비로그인 상태 확인
 */
export async function isLoggedOut(page: Page): Promise<boolean> {
  return !(await isLoggedIn(page));
}

/**
 * 폼 입력 요소 채우기
 */
export async function fillForm(
  page: Page,
  formData: {
    [key: string]: string;
  },
) {
  for (const [key, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${key}"], input[id="${key}"]`);

    if (await input.isVisible()) {
      await input.fill(value);
    }
  }
}

/**
 * 라디오 버튼 선택
 */
export async function selectRadio(page: Page, name: string, value: string) {
  const radio = page.locator(`input[name="${name}"][value="${value}"]`);

  if (await radio.isVisible()) {
    await radio.click();
  }
}

/**
 * 버튼 클릭
 */
export async function clickButton(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`).first();

  if (await button.isVisible()) {
    await button.click();
    return true;
  }

  return false;
}

/**
 * 링크 클릭
 */
export async function clickLink(page: Page, linkText: string) {
  const link = page.locator(`a:has-text("${linkText}")`).first();

  if (await link.isVisible()) {
    await link.click();
    return true;
  }

  return false;
}

/**
 * 다이얼로그 확인 및 처리
 */
export async function handleDialog(
  page: Page,
  dialogTitle: string,
  action: 'confirm' | 'cancel' = 'confirm',
) {
  const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
  const title = page.locator(`text=/${dialogTitle}/i`);

  if (await dialog.isVisible().catch(() => false)) {
    await page.waitForTimeout(300);

    const buttonText = action === 'confirm' ? '확인' : '취소';
    const button = page.locator(`button:has-text("${buttonText}")`);

    if (await button.isVisible()) {
      await button.click();
      await page.waitForTimeout(500);
      return true;
    }
  }

  return false;
}

/**
 * 토스트 메시지 확인
 */
export async function waitForToast(page: Page, message: string, timeout = 3000) {
  const toast = page.locator(`text=/${message}/i`);

  try {
    await expect(toast).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * 입력 필드 값 가져오기
 */
export async function getInputValue(page: Page, inputName: string): Promise<string | null> {
  const input = page.locator(`input[name="${inputName}"]`);

  if (await input.isVisible()) {
    return await input.inputValue();
  }

  return null;
}

/**
 * 입력 필드에 텍스트 입력
 */
export async function typeInInput(page: Page, inputName: string, text: string) {
  const input = page.locator(`input[name="${inputName}"]`);

  if (await input.isVisible()) {
    await input.fill(text);
    return true;
  }

  return false;
}

/**
 * 페이지 스크롤
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = page.locator(selector);

  if (await element.isVisible()) {
    await element.scrollIntoViewIfNeeded();
  }
}

/**
 * 페이지 최상단으로 스크롤
 */
export async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * 페이지 최하단으로 스크롤
 */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * 특정 텍스트가 페이지에 있는지 확인
 */
export async function hasText(page: Page, text: string): Promise<boolean> {
  try {
    const element = page.locator(`text=/${text}/i`);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * 테이블에서 특정 셀 찾기
 */
export async function findTableCell(page: Page, text: string) {
  return page.locator(`table >> text=${text}`);
}

/**
 * 리스트에서 항목 개수 세기
 */
export async function countListItems(page: Page, selector: string): Promise<number> {
  const items = page.locator(selector);
  return await items.count();
}

/**
 * 날짜 문자열 생성 (YYYY-MM-DD)
 */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 어제 날짜 문자열
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

/**
 * 내일 날짜 문자열
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDateString(tomorrow);
}

/**
 * 화면 크기 설정
 */
export async function setViewportSize(
  page: Page,
  width: number,
  height: number,
) {
  await page.setViewportSize({ width, height });
}

/**
 * 데스크톱 뷰로 설정
 */
export async function setDesktopView(page: Page) {
  await setViewportSize(page, 1280, 720);
}

/**
 * 태블릿 뷰로 설정
 */
export async function setTabletView(page: Page) {
  await setViewportSize(page, 768, 1024);
}

/**
 * 모바일 뷰로 설정
 */
export async function setMobileView(page: Page) {
  await setViewportSize(page, 375, 667);
}

/**
 * 요소의 스크린샷 저장
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  filename: string,
) {
  const element = page.locator(selector).first();

  if (await element.isVisible()) {
    await element.screenshot({ path: filename });
  }
}

/**
 * 페이지 스크린샷 저장
 */
export async function takePageScreenshot(page: Page, filename: string) {
  await page.screenshot({ path: filename, fullPage: true });
}

/**
 * 접근성 테스트: 키보드 Tab 네비게이션
 */
export async function testKeyboardNavigation(page: Page, expectedFocusableElements: number) {
  let focusCount = 0;

  // 첫 번째 탭
  await page.keyboard.press('Tab');

  for (let i = 0; i < expectedFocusableElements; i++) {
    const focused = page.locator(':focus');
    if (await focused.count() > 0) {
      focusCount++;
    }

    await page.keyboard.press('Tab');
  }

  expect(focusCount).toBeGreaterThan(0);
}

/**
 * 성능 측정: 페이지 로드 시간
 */
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  return loadTime;
}

/**
 * 성능 측정: 요소 렌더링 시간
 */
export async function measureElementRenderTime(
  page: Page,
  selector: string,
): Promise<number> {
  const startTime = Date.now();
  const element = page.locator(selector);

  try {
    await expect(element).toBeVisible({ timeout: 5000 });
    return Date.now() - startTime;
  } catch {
    return -1; // 렌더링 실패
  }
}

/**
 * 네트워크 요청 확인
 */
export async function waitForNetworkRequest(
  page: Page,
  urlPattern: string,
  timeout = 5000,
) {
  const regex = new RegExp(urlPattern);

  const promise = page.waitForResponse((response) => regex.test(response.url()));

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout),
      ),
    ]);
  } catch {
    return null;
  }
}

/**
 * 콘솔 에러 감시
 */
export function watchConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * URL 확인
 */
export async function expectUrl(page: Page, urlPattern: string | RegExp) {
  if (typeof urlPattern === 'string') {
    await expect(page).toHaveURL(new RegExp(urlPattern));
  } else {
    await expect(page).toHaveURL(urlPattern);
  }
}

/**
 * 페이지 제목 확인
 */
export async function expectPageTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(new RegExp(title));
}

/**
 * 페이지의 모든 이미지 로드 확인
 */
export async function waitForAllImagesLoaded(page: Page) {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(img);
            } else {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            }
          }),
      ),
    );
  });
}

/**
 * 로컬 스토리지에 데이터 저장
 */
export async function setLocalStorage(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => {
    localStorage.setItem(k, v);
  }, [key, value]);
}

/**
 * 로컬 스토리지에서 데이터 가져오기
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);
}

/**
 * 세션 스토리지에 데이터 저장
 */
export async function setSessionStorage(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => {
    sessionStorage.setItem(k, v);
  }, [key, value]);
}

/**
 * 쿠키 설정
 */
export async function setCookie(
  page: Page,
  name: string,
  value: string,
  options?: {
    path?: string;
    domain?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  },
) {
  await page.context().addCookies([
    {
      name,
      value,
      url: page.url(),
      ...options,
    },
  ]);
}

/**
 * 쿠키 가져오기
 */
export async function getCookie(page: Page, name: string): Promise<any | null> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === name) || null;
}

/**
 * 모든 쿠키 삭제
 */
export async function clearCookies(page: Page) {
  await page.context().clearCookies();
}
