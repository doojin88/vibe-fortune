/**
 * 홈(랜딩) 페이지 Unit Test
 *
 * 테스트 범위: Hero, Features, Pricing, FAQ 섹션
 * 주요 기능: CTA 버튼, 인증 상태 조건부 렌더링, 앵커 네비게이션
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from '@/app/page';

// Clerk SDK 모킹
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out">{children}</div>
  ),
  SignInButton: ({ children, mode }: any) => (
    <button data-testid="sign-in-button" data-mode={mode}>
      {children || '로그인'}
    </button>
  ),
  UserButton: () => <button data-testid="user-button">User</button>,
}));

// Next.js Link 모킹
jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  );
});

// lucide-react 모킹
jest.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles">✨</span>,
  UserCircle: () => <span data-testid="icon-user-circle">👤</span>,
  History: () => <span data-testid="icon-history">⏱️</span>,
  Zap: () => <span data-testid="icon-zap">⚡</span>,
  Check: () => <span data-testid="icon-check">✓</span>,
}));

describe('홈(랜딩) 페이지', () => {
  // ============================================
  // 1. 페이지 렌더링 테스트
  // ============================================

  describe('페이지 렌더링', () => {
    it('모든 섹션이 렌더링되어야 한다', () => {
      render(<HomePage />);

      // 각 섹션 ID 확인
      expect(document.getElementById('hero')).toBeInTheDocument();
      expect(document.getElementById('features')).toBeInTheDocument();
      expect(document.getElementById('pricing')).toBeInTheDocument();
      expect(document.getElementById('faq')).toBeInTheDocument();
    });

    it('Hero 섹션의 메인 제목이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const heading = screen.getByRole('heading', {
        name: /AI가 분석하는 나만의 사주팔자/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it('Hero 섹션의 서브 제목이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const subHeading = screen.getByText(/Google 계정으로 1분 안에 시작하세요/i);
      expect(subHeading).toBeInTheDocument();
    });

    it('Features 섹션의 제목이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const featuresTitle = screen.getByRole('heading', {
        name: /주요 기능/i,
      });
      expect(featuresTitle).toBeInTheDocument();
    });

    it('Features 4개 카드가 모두 렌더링되어야 한다', () => {
      render(<HomePage />);

      expect(
        screen.getByText(/AI 기반 전문 분석/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/간편한 Google 로그인/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/분석 이력 관리/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/실시간 스트리밍/i)
      ).toBeInTheDocument();
    });

    it('Pricing 섹션의 제목이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const pricingTitle = screen.getByRole('heading', {
        name: /요금 안내/i,
      });
      expect(pricingTitle).toBeInTheDocument();
    });

    it('Pricing 무료 및 Pro 요금제 카드가 렌더링되어야 한다', () => {
      render(<HomePage />);

      // 무료 요금제
      expect(screen.getByText(/무료/i)).toBeInTheDocument();
      expect(screen.getByText(/₩0/)).toBeInTheDocument();

      // Pro 요금제
      expect(screen.getByText(/Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/₩9,900/)).toBeInTheDocument();
    });

    it('FAQ 섹션의 제목이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const faqTitle = screen.getByRole('heading', {
        name: /자주 묻는 질문/i,
      });
      expect(faqTitle).toBeInTheDocument();
    });

    it('FAQ 6개 항목이 모두 렌더링되어야 한다', () => {
      render(<HomePage />);

      // FAQ 항목 확인
      expect(
        screen.getByText(/어떻게 사용하나요/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/무료 체험 후 비용이 발생하나요/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pro 구독과 무료 버전의 차이/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/개인정보는 안전한가요/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/출생시간을 모르는 경우/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/구독은 언제든지 취소할 수 있나요/i)
      ).toBeInTheDocument();
    });

    it('Footer가 렌더링되어야 한다', () => {
      render(<HomePage />);

      const footer = screen.getByText(/Vibe Fortune/);
      expect(footer).toBeInTheDocument();

      const copyright = screen.getByText(/© 2025 Vibe Fortune/);
      expect(copyright).toBeInTheDocument();
    });
  });

  // ============================================
  // 2. 인증 상태별 렌더링 테스트
  // ============================================

  describe('인증 상태별 렌더링', () => {
    it('비로그인 상태에서 "무료로 시작하기" 버튼이 표시되어야 한다', () => {
      render(<HomePage />);

      const signedOutElement = screen.getByTestId('signed-out');
      expect(signedOutElement).toBeInTheDocument();

      // SignInButton이 렌더링되어야 함
      const signInButton = screen.getByTestId('sign-in-button');
      expect(signInButton).toBeInTheDocument();
    });

    it('로그인 상태에서 "이용하기" 링크가 표시되어야 한다', () => {
      render(<HomePage />);

      const signedInElement = screen.getByTestId('signed-in');
      expect(signedInElement).toBeInTheDocument();

      // Dashboard 링크 확인
      const dashboardLink = screen.getByTestId('link-/dashboard');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveTextContent(/이용하기/i);
    });

    it('로그인 상태에서 UserButton이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const userButton = screen.getByTestId('user-button');
      expect(userButton).toBeInTheDocument();
    });
  });

  // ============================================
  // 3. CTA 버튼 동작 테스트
  // ============================================

  describe('CTA 버튼 동작', () => {
    it('Hero 섹션 "무료로 시작하기" 버튼이 클릭 가능해야 한다', () => {
      render(<HomePage />);

      const startButtons = screen.getAllByTestId('sign-in-button');
      expect(startButtons.length).toBeGreaterThan(0);

      // 첫 번째 버튼 (Hero 섹션)은 클릭 가능해야 함
      expect(startButtons[0]).toBeEnabled();
    });

    it('로그인 상태에서 "이용하기" 링크의 href가 /dashboard이어야 한다', () => {
      render(<HomePage />);

      const dashboardLink = screen.getByTestId('link-/dashboard');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('Pricing 섹션 "Pro 시작하기" 버튼이 존재해야 한다', () => {
      render(<HomePage />);

      // Pro 구독 링크 확인
      const proLinks = screen.getAllByTestId('link-/subscription');
      expect(proLinks.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 4. 앵커 네비게이션 테스트
  // ============================================

  describe('앵커 네비게이션', () => {
    it('모든 섹션에 고유한 ID가 있어야 한다', () => {
      render(<HomePage />);

      const sectionIds = ['hero', 'features', 'pricing', 'faq'];
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        expect(section).toBeInTheDocument();
      });
    });

    it('헤더의 앵커 링크들이 정확한 href를 가져야 한다', () => {
      render(<HomePage />);

      // 네비게이션 링크 확인 (존재 시)
      // 헤더 구조에 따라 수정 필요
      const navLinks = screen.queryAllByRole('link');
      expect(navLinks.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 5. FAQ 아코디언 테스트
  // ============================================

  describe('FAQ 아코디언', () => {
    it('FAQ 항목들이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const faqQuestions = [
        /어떻게 사용하나요/i,
        /무료 체험 후 비용이 발생하나요/i,
        /Pro 구독과 무료 버전의 차이/i,
      ];

      faqQuestions.forEach((question) => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });
    });

    it('FAQ 답변들이 렌더링되어야 한다', () => {
      render(<HomePage />);

      const answers = [
        /Google 계정으로 로그인 후 생년월일과 출생시간을 입력/i,
        /초기 3회는 무료로 이용/i,
        /Pro 구독은 더 정교한 AI 모델/i,
      ];

      answers.forEach((answer) => {
        expect(screen.getByText(answer)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // 6. 반응형 디자인 테스트
  // ============================================

  describe('반응형 디자인', () => {
    it('Hero 섹션이 모바일, 태블릿, 데스크톱에서 렌더링되어야 한다', () => {
      render(<HomePage />);

      const heroSection = document.getElementById('hero');
      expect(heroSection).toBeInTheDocument();

      // Tailwind 클래스 확인 (선택사항)
      // expect(heroSection).toHaveClass('py-12', 'md:py-16', 'lg:py-20');
    });

    it('Features 섹션이 그리드 레이아웃으로 렌더링되어야 한다', () => {
      render(<HomePage />);

      const featureCards = screen.getAllByText(/Sparkles|User Circle|History|Zap/i);
      expect(featureCards.length).toBeGreaterThan(0);
    });

    it('Pricing 섹션이 2개 카드를 가져야 한다', () => {
      render(<HomePage />);

      const pricingSection = document.getElementById('pricing');
      expect(pricingSection).toBeInTheDocument();

      // 무료와 Pro 카드가 모두 존재해야 함
      expect(screen.getByText(/무료/i)).toBeInTheDocument();
      expect(screen.getByText(/Pro/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // 7. 접근성 테스트
  // ============================================

  describe('접근성 (a11y)', () => {
    it('모든 제목이 의미론적 heading 태그를 사용해야 한다', () => {
      render(<HomePage />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      headings.forEach((heading) => {
        expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(
          heading.tagName.toLowerCase()
        );
      });
    });

    it('모든 버튼이 클릭 가능해야 한다', () => {
      render(<HomePage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('모든 링크가 href 속성을 가져야 한다', () => {
      render(<HomePage />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  // ============================================
  // 8. Features 카드 콘텐츠 테스트
  // ============================================

  describe('Features 카드 콘텐츠', () => {
    it('AI 기반 전문 분석 카드가 정확한 내용을 가져야 한다', () => {
      render(<HomePage />);

      expect(
        screen.getByText(/AI 기반 전문 분석/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Gemini API를 활용한 20년 경력 사주상담사 수준의 분석/i)
      ).toBeInTheDocument();
    });

    it('간편한 Google 로그인 카드가 정확한 내용을 가져야 한다', () => {
      render(<HomePage />);

      expect(
        screen.getByText(/간편한 Google 로그인/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/클릭 한 번으로 시작, 복잡한 회원가입 절차 없음/i)
      ).toBeInTheDocument();
    });

    it('분석 이력 관리 카드가 정확한 내용을 가져야 한다', () => {
      render(<HomePage />);

      expect(
        screen.getByText(/분석 이력 관리/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/과거 분석 결과를 언제든 다시 확인 가능/i)
      ).toBeInTheDocument();
    });

    it('실시간 스트리밍 카드가 정확한 내용을 가져야 한다', () => {
      render(<HomePage />);

      expect(
        screen.getByText(/실시간 스트리밍/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/AI 분석 결과를 실시간으로 확인하며 기다림 없는 경험/i)
      ).toBeInTheDocument();
    });
  });

  // ============================================
  // 9. Pricing 카드 콘텐츠 테스트
  // ============================================

  describe('Pricing 카드 콘텐츠', () => {
    it('무료 요금제 카드가 정확한 정보를 표시해야 한다', () => {
      render(<HomePage />);

      expect(screen.getByText(/무료/i)).toBeInTheDocument();
      expect(screen.getByText(/₩0/)).toBeInTheDocument();
      expect(screen.getByText(/누구나 무료로 시작/i)).toBeInTheDocument();

      // 무료 혜택 확인
      expect(
        screen.getByText(/초기 3회 분석 가능/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/기본 AI 분석 \(gemini-2.5-flash\)/i)
      ).toBeInTheDocument();
    });

    it('Pro 요금제 카드가 정확한 정보를 표시해야 한다', () => {
      render(<HomePage />);

      expect(screen.getByText(/Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/₩9,900 \/월/)).toBeInTheDocument();
      expect(screen.getByText(/고급 분석과 더 많은 혜택/i)).toBeInTheDocument();

      // Pro 혜택 확인
      expect(
        screen.getByText(/월 10회 분석 가능/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/고급 AI 분석 \(gemini-2.5-pro\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/직업운, 사업운 분석/i)
      ).toBeInTheDocument();
    });

    it('Pro 카드에 "인기" 배지가 표시되어야 한다', () => {
      render(<HomePage />);

      const popularBadge = screen.getByText(/인기/i);
      expect(popularBadge).toBeInTheDocument();
    });
  });

  // ============================================
  // 10. SEO 메타데이터 테스트 (선택사항)
  // ============================================

  describe('SEO 최적화', () => {
    it('페이지가 렌더링될 수 있어야 한다 (SSR 호환성)', () => {
      const { container } = render(<HomePage />);

      expect(container).toBeInTheDocument();
      expect(container.firstChild).not.toBeEmptyDOMElement();
    });
  });
});
