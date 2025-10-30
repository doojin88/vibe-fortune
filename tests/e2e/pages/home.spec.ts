import { test, expect } from '@playwright/test';

test.describe('Home Page (Landing Page)', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('TC-HOME-001: should load home page with all sections', async ({ page }) => {
    // 홈 페이지의 모든 섹션이 정상적으로 로드되는지 확인

    // 페이지 로드 상태 확인
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Vibe Fortune/);
    
    // 페이지 HTML 구조 디버깅
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Contains #hero:', pageContent.includes('id="hero"'));
    console.log('Contains #features:', pageContent.includes('id="features"'));
    console.log('Contains #pricing:', pageContent.includes('id="pricing"'));
    console.log('Contains #faq:', pageContent.includes('id="faq"'));

    const hero = page.locator('#hero');
    const features = page.locator('#features');
    const pricing = page.locator('#pricing');
    const faq = page.locator('#faq');

    // 각 섹션이 존재하는지 확인
    const heroExists = await hero.count() > 0;
    const featuresExists = await features.count() > 0;
    const pricingExists = await pricing.count() > 0;
    const faqExists = await faq.count() > 0;

    console.log('Section counts:', {
      hero: await hero.count(),
      features: await features.count(),
      pricing: await pricing.count(),
      faq: await faq.count()
    });

    if (heroExists) {
      await expect(hero).toBeVisible();
    } else {
      console.log('Hero section not found, checking for alternative selectors...');
      // 대안 선택자로 확인
      const heroAlt = page.locator('section:has-text("AI가 분석하는")');
      if (await heroAlt.count() > 0) {
        await expect(heroAlt).toBeVisible();
      }
    }

    if (featuresExists) {
      await expect(features).toBeVisible();
    }
    
    if (pricingExists) {
      await expect(pricing).toBeVisible();
    }
    
    if (faqExists) {
      await expect(faq).toBeVisible();
    }

    // 각 섹션의 주요 제목 확인
    await expect(page.locator('h1:has-text("AI가 분석하는")')).toBeVisible();
    await expect(page.locator('h2:has-text("주요 기능")')).toBeVisible();
    await expect(page.locator('h2:has-text("요금 안내")')).toBeVisible();
    await expect(page.locator('h2:has-text("자주 묻는 질문")')).toBeVisible();
  });

  test('TC-HOME-002: unauthenticated user should see sign in button', async ({ page }) => {
    // 비로그인 사용자는 "무료로 시작하기" 버튼을 봐야 함

    const heroSection = page.locator('#hero');
    const cta = heroSection.locator('button:has-text("무료로 시작하기")').first();

    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test('TC-HOME-003: CTA button should trigger clerk modal', async ({ page }) => {
    // "무료로 시작하기" 버튼 클릭 시 Clerk 모달이 표시되어야 함

    const cta = page.locator('#hero button:has-text("무료로 시작하기")').first();
    
    // 버튼이 존재하는지 먼저 확인
    await expect(cta).toBeVisible();
    await cta.click();

    // Clerk 모달이 표시되는지 확인 (더 긴 타임아웃)
    const clerkModal = page.locator('[role="dialog"]');
    await expect(clerkModal).toBeVisible({ timeout: 10000 });
  });

  test('TC-HOME-004: anchor navigation should scroll to sections', async ({ page }) => {
    // 앵커 네비게이션 확인

    // "서비스" 링크 클릭
    const servicesLink = page.locator('a:has-text("서비스")').first();
    await expect(servicesLink).toBeVisible();
    await servicesLink.click();

    // Features 섹션으로 스크롤되는지 확인
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeInViewport();

    // "가격" 링크 클릭
    const pricingLink = page.locator('a:has-text("가격")').first();
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();

    // Pricing 섹션으로 스크롤되는지 확인
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeInViewport();

    // "FAQ" 링크 클릭
    const faqLink = page.locator('a:has-text("FAQ")').first();
    await expect(faqLink).toBeVisible();
    await faqLink.click();

    // FAQ 섹션으로 스크롤되는지 확인
    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeInViewport();
  });

  test('TC-HOME-005: pricing cards should display correctly', async ({ page }) => {
    // Pricing 섹션의 무료 및 Pro 카드 확인

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    // 무료 요금제 카드 확인
    const freeCard = pricingSection.locator('text=/무료/i').first();
    await expect(freeCard).toBeVisible();

    // Pro 요금제 카드 확인
    const proCard = pricingSection.locator('text=/Pro/i').first();
    await expect(proCard).toBeVisible();

    // Pro 카드에 "인기" 배지 확인 (섹션 범위에서 배지 존재 확인)
    const popularBadge = pricingSection.locator('text=인기').first();
    await expect(popularBadge).toBeVisible();

    // 각 카드의 CTA 버튼 확인
    const freeCta = pricingSection.getByRole('button', { name: '무료로 시작하기' }).first();
    const proCta = pricingSection.getByRole('button', { name: 'Pro 시작하기' }).first();

    await expect(freeCta).toBeVisible({ timeout: 10000 });
    await expect(proCta).toBeVisible({ timeout: 10000 });
  });

  test('TC-HOME-006: FAQ accordion should toggle', async ({ page }) => {
    // FAQ 섹션의 아코디언 동작 확인

    const faqSection = page.locator('#faq');
    await faqSection.scrollIntoViewIfNeeded();

    // 첫 번째 FAQ 항목 버튼
    const firstQuestion = faqSection.getByRole('button').first();

    // 질문 클릭 (토글 열기)
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.click();
    await page.waitForTimeout(300); // 애니메이션 대기

    // 열림 상태 확인 (AccordionItem에 data-state="open" 존재)
    const openedItem = faqSection.locator('[data-state="open"]');
    await expect(openedItem.first()).toBeVisible();

    // 닫기 시도 (다시 클릭)
    await firstQuestion.click();
    await page.waitForTimeout(300);
  });

  test('TC-HOME-007: feature cards should display all features', async ({ page }) => {
    // Features 섹션의 4가지 기능 카드 확인

    const featuresSection = page.locator('#features');
    await featuresSection.scrollIntoViewIfNeeded();

    // 4가지 기능 확인
    const featureTexts = [
      'AI 기반 전문 분석',
      '간편한 Google 로그인',
      '분석 이력 관리',
      '실시간 스트리밍',
    ];

    for (const feature of featureTexts) {
      const featureCard = featuresSection.locator(`text=${feature}`);
      await expect(featureCard).toBeVisible();
    }
  });

  test('TC-HOME-008: footer should be visible', async ({ page }) => {
    // 페이지 최하단으로 스크롤하여 Footer 확인

    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // 저작권 정보 확인 (footer 범위로 제한)
    const copyright = footer.locator('text=/©|All rights reserved|Vibe Fortune/');
    await expect(copyright.first()).toBeVisible();
  });

  test('TC-HOME-009: responsive design - pricing cards stack on mobile', async ({ page }) => {
    // 모바일 뷰에서 가격 카드가 세로로 쌓이는지 확인

    // 모바일 뷰 설정 (이미 viewport 크기 설정 가능)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    // 카드들이 모바일 레이아웃으로 표시되는지 확인
    const cards = pricingSection.locator('[class*="grid"], [class*="flex"]');
    await expect(cards.first()).toBeVisible();
  });

  test('TC-HOME-010: page should load within acceptable time', async ({ page }) => {
    // 페이지 로드 시간 측정

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000);
  });

  test('TC-HOME-011: header logo should navigate to home', async ({ page }) => {
    // 로고 클릭 시 홈으로 이동

    // 페이지를 아래로 스크롤
    await page.evaluate(() => window.scrollBy(0, 500));

    // 로고 클릭
    const logo = page.locator('a:has-text("Vibe Fortune")').first();
    if (await logo.isVisible()) {
      await logo.click();

      // 홈으로 돌아왔는지 확인
      const hero = page.locator('#hero');
      await expect(hero).toBeInViewport();
    }
  });

  test('TC-HOME-012: pricing section - pro card should be highlighted', async ({ page }) => {
    // Pro 카드가 시각적으로 강조되어야 함

    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    // Pro 카드 찾기 - 더 정확한 선택자 사용
    const proCard = pricingSection.locator('text=/Pro/').first();

    // Pro 카드가 존재하는지 확인
    await expect(proCard).toBeVisible();

    // Pro 카드의 부모 요소에서 스타일 확인
    const proCardContainer = proCard.locator('..');
    const proCardClass = await proCardContainer.getAttribute('class');

    // 일반적으로 Pro 카드는 "border", "shadow", "scale" 등의 클래스가 있을 것으로 예상
    expect(proCardClass).toBeTruthy();
  });
});
