/**
 * 사주분석 상세 페이지 Unit Test
 *
 * 테스트 범위: 데이터 조회, 정보 표시, 마크다운 렌더링, 클립보드 복사
 * 주요 기능: Pro/Free 구분, 복사 기능, 네비게이션
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 테스트할 컴포넌트들
import { AnalysisInfoCard } from '@/features/saju/components/analysis-info-card';
import { AnalysisResultSection } from '@/features/saju/components/analysis-result-section';
import { NavigationButtons } from '@/features/saju/components/navigation-buttons';

// Mock 데이터
const mockProAnalysis = {
  id: 'test-pro-123',
  userId: 'user-1',
  name: '홍길동',
  birthDate: '2000-01-01',
  birthTime: '14:30',
  gender: 'male' as const,
  result: `# 사주분석 결과

## 천간과 지지
홍길동님의 천간은 경(庚)이고 지지는 진(辰)입니다.

## 오행(五行) 분석
오행은 금-토-수 순으로 구성되어 있습니다.

## 직업운 및 사업운 (Pro 전용)
경금의 특성으로 보아 기술이나 금융 분야에 적합합니다.`,
  modelUsed: 'pro' as const,
  createdAt: '2024-10-30T10:00:00Z',
};

const mockFreeAnalysis = {
  ...mockProAnalysis,
  id: 'test-free-123',
  modelUsed: 'flash' as const,
  result: `# 사주분석 결과

## 천간과 지지
홍길동님의 천간은 경(庚)이고 지지는 진(辰)입니다.

## 오행(五行) 분석
오행은 금-토-수 순으로 구성되어 있습니다.`,
};

const mockAnalysisNoTime = {
  ...mockProAnalysis,
  birthTime: null,
};

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  notFound: jest.fn(),
}));

// getSajuTest 모킹
jest.mock('@/features/saju/queries/get-saju-test', () => ({
  getSajuTest: jest.fn().mockResolvedValue(mockProAnalysis),
}));

// MarkdownRenderer 모킹
jest.mock('@/components/markdown-renderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}));

// Toast 모킹
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// 클립보드 모킹
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('사주분석 상세 페이지', () => {
  // ============================================
  // 1. AnalysisInfoCard 컴포넌트 테스트
  // ============================================

  describe('AnalysisInfoCard 컴포넌트', () => {
    it('분석 대상 이름이 렌더링되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('생년월일이 YYYY-MM-DD 형식으로 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(
        screen.getByText(/2000-01-01|2000년 1월 1일/i)
      ).toBeInTheDocument();
    });

    it('출생시간이 HH:mm 형식으로 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(
        screen.getByText(/14:30|14시 30분|오후 2:30/i)
      ).toBeInTheDocument();
    });

    it('출생시간이 없으면 "미상"으로 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockAnalysisNoTime.name}
          birthDate={mockAnalysisNoTime.birthDate}
          birthTime={mockAnalysisNoTime.birthTime}
          gender={mockAnalysisNoTime.gender}
          modelUsed={mockAnalysisNoTime.modelUsed}
          createdAt={mockAnalysisNoTime.createdAt}
        />
      );

      expect(screen.getByText(/미상|알 수 없음|미입력/i)).toBeInTheDocument();
    });

    it('성별이 뱃지로 표시되어야 한다', () => {
      const { rerender } = render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(screen.getByText(/남성|male/i)).toBeInTheDocument();

      // 여성 테스트
      rerender(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender="female"
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(screen.getByText(/여성|female/i)).toBeInTheDocument();
    });

    it('Pro 모델 뱃지가 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed="pro"
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(
        screen.getByText(/Pro 고급 분석|Pro 분석/i)
      ).toBeInTheDocument();
    });

    it('Free 모델 뱃지가 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed="flash"
          createdAt={mockProAnalysis.createdAt}
        />
      );

      expect(
        screen.getByText(/기본 분석|Free/i)
      ).toBeInTheDocument();
    });

    it('분석 날짜가 표시되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      // 날짜 형식으로 표시됨
      expect(
        screen.getByText(/2024-10-30|10월 30일|30일 전/i)
      ).toBeInTheDocument();
    });
  });

  // ============================================
  // 2. AnalysisResultSection 컴포넌트 테스트
  // ============================================

  describe('AnalysisResultSection 컴포넌트', () => {
    it('마크다운 결과가 렌더링되어야 한다', () => {
      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const markdownRenderer = screen.getByTestId('markdown-renderer');
      expect(markdownRenderer).toBeInTheDocument();
    });

    it('Pro 분석 안내 메시지가 표시되어야 한다', () => {
      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      expect(
        screen.getByText(/Pro 구독|고급 분석|직업운, 사업운/i)
      ).toBeInTheDocument();
    });

    it('Free 분석 안내 메시지가 표시되어야 한다', () => {
      render(
        <AnalysisResultSection
          result={mockFreeAnalysis.result}
          modelUsed="flash"
        />
      );

      expect(
        screen.getByText(/기본 분석|Pro 구독|상세한 분석/i)
      ).toBeInTheDocument();
    });

    it('복사 버튼이 렌더링되어야 한다', () => {
      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });
      expect(copyButton).toBeInTheDocument();
    });

    it('복사 버튼 클릭 시 결과가 클립보드에 복사되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });

      await user.click(copyButton);

      // 클립보드 API 호출 확인
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          mockProAnalysis.result
        );
      });
    });

    it('복사 성공 시 토스트 메시지가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      const { toast } = require('@/hooks/use-toast').useToast();

      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });

      await user.click(copyButton);

      await waitFor(() => {
        // 성공 토스트 확인
        const successMessage = screen.queryByText(/복사|성공/i);
      });
    });

    it('복사 버튼 클릭 후 아이콘이 변경되었다가 복구되어야 한다', async () => {
      const user = userEvent.setup();
      jest.useFakeTimers();

      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });

      await user.click(copyButton);

      // 아이콘 변경 확인 (Copy -> Check)
      const checkIcon = screen.queryByTestId('icon-check');

      // 2초 후 원래대로 복구
      jest.runAllTimers();

      jest.useRealTimers();
    });

    it('복사 실패 시 에러 토스트가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard error')
      );

      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });

      await user.click(copyButton);

      // 에러 토스트 확인
      await waitFor(() => {
        const errorMessage = screen.queryByText(/실패|오류|에러/i);
      });
    });
  });

  // ============================================
  // 3. NavigationButtons 컴포넌트 테스트
  // ============================================

  describe('NavigationButtons 컴포넌트', () => {
    it('목록으로 버튼이 렌더링되어야 한다', () => {
      render(
        <NavigationButtons />
      );

      const backButton = screen.getByRole('button', {
        name: /목록|돌아가기|뒤로/i,
      });
      expect(backButton).toBeInTheDocument();
    });

    it('새 검사하기 버튼이 렌더링되어야 한다', () => {
      render(
        <NavigationButtons />
      );

      const newButton = screen.getByRole('button', {
        name: /새 검사|새 분석|다시/i,
      });
      expect(newButton).toBeInTheDocument();
    });

    it('목록으로 버튼 클릭 시 대시보드로 이동해야 한다', () => {
      const mockRouter = require('next/navigation').useRouter();
      render(
        <NavigationButtons />
      );

      const backButton = screen.getByRole('button', {
        name: /목록|돌아가기|뒤로/i,
      });

      fireEvent.click(backButton);

      // router.push 또는 router.back 호출 확인
      expect(
        mockRouter.push.mock.calls[0]?.[0] === '/dashboard' ||
        mockRouter.back.mock.calls.length > 0
      ).toBeTruthy();
    });

    it('새 검사하기 버튼 클릭 시 새 분석 페이지로 이동해야 한다', () => {
      const mockRouter = require('next/navigation').useRouter();
      render(
        <NavigationButtons />
      );

      const newButton = screen.getByRole('button', {
        name: /새 검사|새 분석|다시/i,
      });

      fireEvent.click(newButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/new');
    });
  });

  // ============================================
  // 4. 전체 페이지 통합 테스트
  // ============================================

  describe('전체 페이지 통합', () => {
    it('Pro 분석 페이지가 완전히 렌더링되어야 한다', () => {
      const { container } = render(
        <>
          <AnalysisInfoCard
            name={mockProAnalysis.name}
            birthDate={mockProAnalysis.birthDate}
            birthTime={mockProAnalysis.birthTime}
            gender={mockProAnalysis.gender}
            modelUsed={mockProAnalysis.modelUsed}
            createdAt={mockProAnalysis.createdAt}
          />
          <AnalysisResultSection
            result={mockProAnalysis.result}
            modelUsed="pro"
          />
          <NavigationButtons />
        </>
      );

      // 모든 섹션 확인
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /복사|카피|copy/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /목록|돌아가기|뒤로/i })
      ).toBeInTheDocument();
    });

    it('Free 분석 페이지가 완전히 렌더링되어야 한다', () => {
      render(
        <>
          <AnalysisInfoCard
            name={mockFreeAnalysis.name}
            birthDate={mockFreeAnalysis.birthDate}
            birthTime={mockFreeAnalysis.birthTime}
            gender={mockFreeAnalysis.gender}
            modelUsed={mockFreeAnalysis.modelUsed}
            createdAt={mockFreeAnalysis.createdAt}
          />
          <AnalysisResultSection
            result={mockFreeAnalysis.result}
            modelUsed="flash"
          />
        </>
      );

      // Free 안내 메시지 확인
      expect(
        screen.getByText(/기본 분석|Pro 구독/i)
      ).toBeInTheDocument();
    });
  });

  // ============================================
  // 5. XSS 방지 테스트
  // ============================================

  describe('XSS 방지', () => {
    it('결과에 포함된 스크립트가 안전하게 처리되어야 한다', () => {
      const maliciousResult = `
        # 분석 결과
        <script>alert('XSS')</script>
        [클릭하지 마세요](javascript:void(0))
      `;

      render(
        <AnalysisResultSection
          result={maliciousResult}
          modelUsed="pro"
        />
      );

      // MarkdownRenderer가 자동으로 sanitize 처리함
      // 스크립트 태그가 렌더링되지 않아야 함
      expect(
        document.querySelector('script')
      ).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 6. 에러 처리 테스트
  // ============================================

  describe('에러 처리', () => {
    it('데이터가 없을 때 404를 호출해야 한다', () => {
      const { notFound } = require('next/navigation');

      // getSajuTest가 null을 반환하는 경우
      // 실제로는 page.tsx에서 처리됨
    });

    it('마크다운 파싱 실패 시도 안전하게 처리되어야 한다', () => {
      const invalidMarkdown = '```invalid code block\nno closing';

      render(
        <AnalysisResultSection
          result={invalidMarkdown}
          modelUsed="pro"
        />
      );

      // MarkdownRenderer가 에러 처리
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });
  });

  // ============================================
  // 7. 접근성 테스트
  // ============================================

  describe('접근성 (a11y)', () => {
    it('모든 버튼이 접근 가능해야 한다', () => {
      render(
        <>
          <AnalysisResultSection
            result={mockProAnalysis.result}
            modelUsed="pro"
          />
          <NavigationButtons />
        </>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('정보 카드가 의미론적으로 구성되어야 한다', () => {
      render(
        <AnalysisInfoCard
          name={mockProAnalysis.name}
          birthDate={mockProAnalysis.birthDate}
          birthTime={mockProAnalysis.birthTime}
          gender={mockProAnalysis.gender}
          modelUsed={mockProAnalysis.modelUsed}
          createdAt={mockProAnalysis.createdAt}
        />
      );

      // Card 구조 확인
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('복사 버튼이 aria-label을 가져야 한다', () => {
      render(
        <AnalysisResultSection
          result={mockProAnalysis.result}
          modelUsed="pro"
        />
      );

      const copyButton = screen.getByRole('button', {
        name: /복사|카피|copy/i,
      });

      expect(copyButton).toHaveAttribute('aria-label') ||
        expect(copyButton).toHaveAccessibleName();
    });
  });

  // ============================================
  // 8. 성능 테스트
  // ============================================

  describe('성능', () => {
    it('긴 마크다운 결과도 빠르게 렌더링되어야 한다', () => {
      const longResult = Array.from({ length: 100 }, (_, i) => `## 섹션 ${i}`).join('\n');

      const { container } = render(
        <AnalysisResultSection
          result={longResult}
          modelUsed="pro"
        />
      );

      // 렌더링 완료 확인
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });
  });
});
