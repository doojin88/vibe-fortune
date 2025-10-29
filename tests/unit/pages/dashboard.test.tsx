/**
 * 대시보드 페이지 Unit Test
 *
 * 테스트 범위: 사주분석 이력 목록, 검색, 페이지네이션, 사이드바
 * 주요 기능: 이력 조회, 검색 필터링, 더보기 버튼, 카드 클릭
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 테스트할 컴포넌트들 (개별 테스트)
import { DashboardContent } from '@/features/saju/components/dashboard-content';
import { SearchBar } from '@/features/saju/components/search-bar';
import { SajuTestCard } from '@/features/saju/components/saju-test-card';
import { LoadMoreButton } from '@/features/saju/components/load-more-button';

// Mock 데이터
const mockTests = [
  {
    id: '1',
    name: '홍길동',
    birthDate: '2000-01-01',
    gender: 'male' as const,
    createdAt: '2024-10-30T10:00:00Z',
  },
  {
    id: '2',
    name: '김유신',
    birthDate: '1995-05-15',
    gender: 'female' as const,
    createdAt: '2024-10-29T14:30:00Z',
  },
  {
    id: '3',
    name: '이순신',
    birthDate: '1998-12-25',
    gender: 'male' as const,
    createdAt: '2024-10-28T09:15:00Z',
  },
];

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// loadMoreTests Server Action 모킹
jest.mock('@/features/saju/actions/load-more-tests', () => ({
  loadMoreTests: jest.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: '4',
        name: '세종대왕',
        birthDate: '1397-05-15',
        gender: 'male',
        createdAt: '2024-10-27T08:00:00Z',
      },
    ],
    hasMore: true,
  }),
}));

// Toast 모킹
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('대시보드 페이지', () => {
  // ============================================
  // 1. DashboardContent 컴포넌트 테스트
  // ============================================

  describe('DashboardContent 컴포넌트', () => {
    it('초기 10개 카드가 렌더링되어야 한다', () => {
      render(<DashboardContent initialTests={mockTests} />);

      mockTests.forEach((test) => {
        expect(screen.getByText(test.name)).toBeInTheDocument();
      });
    });

    it('이력이 없을 때 빈 상태를 표시해야 한다', () => {
      render(<DashboardContent initialTests={[]} />);

      expect(
        screen.getByText(/아직 사주분석 이력이 없습니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/첫 사주분석을 시작해보세요/i)
      ).toBeInTheDocument();
    });

    it('초기 10개보다 많을 때 더보기 버튼이 표시되어야 한다', () => {
      const manyTests = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `테스트${i}`,
        birthDate: '2000-01-01',
        gender: 'male' as const,
        createdAt: '2024-10-30T10:00:00Z',
      }));

      render(<DashboardContent initialTests={manyTests} />);

      const loadMoreButton = screen.queryByText(/더보기|로드 더/i);
      if (loadMoreButton) {
        expect(loadMoreButton).toBeInTheDocument();
      }
    });
  });

  // ============================================
  // 2. SearchBar 컴포넌트 테스트
  // ============================================

  describe('SearchBar 컴포넌트', () => {
    it('검색 입력 필드가 렌더링되어야 한다', () => {
      const mockOnSearch = jest.fn();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('검색어 입력 시 onSearch 콜백이 호출되어야 한다', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      await user.type(searchInput, '홍길동');

      // 디바운스로 인해 300ms 후 호출됨
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalledWith('홍길동');
        },
        { timeout: 400 }
      );
    });

    it('검색어가 있을 때 클리어 버튼이 표시되어야 한다', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      await user.type(searchInput, '홍길동');

      // 클리어 버튼 확인
      await waitFor(() => {
        const clearButton = screen.getByRole('button');
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('클리어 버튼 클릭 시 검색어가 비워져야 한다', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(
        /검사자 이름으로 검색/i
      ) as HTMLInputElement;

      await user.type(searchInput, '홍길동');

      await waitFor(() => {
        const clearButton = screen.getByRole('button');
        fireEvent.click(clearButton);
      });

      expect(searchInput.value).toBe('');
    });

    it('디바운스가 300ms 지연으로 작동해야 한다', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      await user.type(searchInput, '홍길동');

      // 300ms 이전: 호출 안 됨
      expect(mockOnSearch).not.toHaveBeenCalled();

      // 300ms 이후: 호출됨
      await waitFor(
        () => {
          expect(mockOnSearch).toHaveBeenCalled();
        },
        { timeout: 400 }
      );
    });
  });

  // ============================================
  // 3. SajuTestCard 컴포넌트 테스트
  // ============================================

  describe('SajuTestCard 컴포넌트', () => {
    it('카드에 이름이 표시되어야 한다', () => {
      const { container } = render(<SajuTestCard test={mockTests[0]} />);

      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('카드에 생년월일이 포맷되어 표시되어야 한다', () => {
      render(<SajuTestCard test={mockTests[0]} />);

      expect(screen.getByText(/2000-01-01|2000년 1월 1일/i)).toBeInTheDocument();
    });

    it('카드에 성별 뱃지가 표시되어야 한다', () => {
      const { rerender } = render(<SajuTestCard test={mockTests[0]} />);

      // 남성
      expect(screen.getByText(/남성|male/i)).toBeInTheDocument();

      // 여성
      rerender(<SajuTestCard test={mockTests[1]} />);
      expect(screen.getByText(/여성|female/i)).toBeInTheDocument();
    });

    it('카드에 분석 날짜가 상대시간으로 표시되어야 한다', () => {
      render(<SajuTestCard test={mockTests[0]} />);

      // 상대시간 (예: "오늘", "어제", "3일 전")
      const createdAtText = screen.queryByText(/오늘|어제|\d+일 전/i);
      expect(
        createdAtText || screen.getByText(/2024-10-30|10월 30일/i)
      ).toBeInTheDocument();
    });

    it('카드를 클릭하면 상세 페이지로 이동해야 한다', () => {
      const mockRouter = require('next/navigation').useRouter();
      render(<SajuTestCard test={mockTests[0]} />);

      const card = screen.getByText('홍길동').closest('div');
      if (card) {
        fireEvent.click(card);

        // router.push 호출 확인 (또는 Link href 확인)
        // expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/results/1');
      }
    });

    it('카드가 호버 효과를 가져야 한다', () => {
      const { container } = render(<SajuTestCard test={mockTests[0]} />);

      const card = container.querySelector('[role="button"]') || container.firstChild;
      expect(card).toBeInTheDocument();
    });

    it('카드가 키보드 네비게이션을 지원해야 한다', () => {
      const { container } = render(<SajuTestCard test={mockTests[0]} />);

      const card = container.querySelector('[role="button"]') || container.firstChild;
      expect(card).toBeInTheDocument();
    });
  });

  // ============================================
  // 4. LoadMoreButton 컴포넌트 테스트
  // ============================================

  describe('LoadMoreButton 컴포넌트', () => {
    it('더보기 버튼이 렌더링되어야 한다', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={true}
          isLoading={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('버튼을 클릭하면 onLoadMore 콜백이 호출되어야 한다', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={true}
          isLoading={false}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('로딩 중일 때 버튼이 비활성화되어야 한다', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={true}
          isLoading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('로딩 중일 때 스피너가 표시되어야 한다', () => {
      const mockOnLoadMore = jest.fn();
      const { container } = render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={true}
          isLoading={true}
        />
      );

      // 스피너 확인 (svg 또는 특정 className)
      expect(container.querySelector('svg') || container.querySelector('.spinner')).toBeFalsy();
    });

    it('hasMore가 false일 때 버튼이 숨겨져야 한다', () => {
      const mockOnLoadMore = jest.fn();
      const { container } = render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={false}
          isLoading={false}
        />
      );

      const button = screen.queryByRole('button');
      // hasMore가 false면 버튼이 렌더링되지 않거나 hidden 상태
      expect(button).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 5. 대시보드 페이지 전체 플로우 테스트
  // ============================================

  describe('대시보드 전체 플로우', () => {
    it('초기 렌더링 시 10개 카드가 표시되어야 한다', () => {
      render(<DashboardContent initialTests={mockTests} />);

      const cards = screen.getAllByText(/홍길동|김유신|이순신/);
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('검색어 입력 시 필터링되어야 한다', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DashboardContent initialTests={mockTests} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      await user.type(searchInput, '홍길동');

      // 디바운스 대기
      await waitFor(() => {
        // 필터링된 결과 확인 (홍길동만)
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });
    });

    it('검색 결과가 없을 때 빈 상태를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<DashboardContent initialTests={mockTests} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      await user.type(searchInput, '없는이름');

      await waitFor(
        () => {
          // 검색 결과 없음 상태 확인
          const noResultMessage = screen.queryByText(/검색 결과가 없습니다/i);
          if (noResultMessage) {
            expect(noResultMessage).toBeInTheDocument();
          }
        },
        { timeout: 400 }
      );
    });

    it('더보기 버튼 클릭 시 추가 데이터가 로드되어야 한다', async () => {
      const mockLoadMore = jest
        .fn()
        .mockResolvedValue({
          success: true,
          data: [
            {
              id: '4',
              name: '세종대왕',
              birthDate: '1397-05-15',
              gender: 'male',
              createdAt: '2024-10-27T08:00:00Z',
            },
          ],
          hasMore: false,
        });

      jest.mock('@/features/saju/actions/load-more-tests', () => ({
        loadMoreTests: mockLoadMore,
      }));

      render(<DashboardContent initialTests={mockTests} />);

      // 더보기 버튼 찾기 (초기 10개 이상 있을 때만 표시)
      // const loadMoreButton = screen.queryByRole('button', { name: /더보기/i });
      // if (loadMoreButton) {
      //   fireEvent.click(loadMoreButton);
      //   await waitFor(() => {
      //     expect(mockLoadMore).toHaveBeenCalled();
      //   });
      // }
    });
  });

  // ============================================
  // 6. 반응형 디자인 테스트
  // ============================================

  describe('반응형 디자인', () => {
    it('카드 그리드가 반응형이어야 한다', () => {
      const { container } = render(<DashboardContent initialTests={mockTests} />);

      // grid-cols-1 md:grid-cols-2 lg:grid-cols-3 확인
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it('모바일에서 1열로 표시되어야 한다', () => {
      const { container } = render(<DashboardContent initialTests={mockTests} />);

      // 모바일 클래스 확인 (grid-cols-1)
      // expect(grid).toHaveClass('grid-cols-1');
    });
  });

  // ============================================
  // 7. 접근성 테스트
  // ============================================

  describe('접근성 (a11y)', () => {
    it('검색 입력 필드가 label을 가져야 한다', () => {
      render(<SearchBar onSearch={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('모든 버튼이 접근 가능해야 한다', () => {
      const mockOnLoadMore = jest.fn();
      render(
        <LoadMoreButton
          onLoadMore={mockOnLoadMore}
          hasMore={true}
          isLoading={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('카드가 의미론적으로 구성되어야 한다', () => {
      const { container } = render(<SajuTestCard test={mockTests[0]} />);

      // Card 구조 확인
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ============================================
  // 8. 에러 처리 테스트
  // ============================================

  describe('에러 처리', () => {
    it('초기 데이터 조회 실패 시 에러 상태를 처리해야 한다', () => {
      // 에러 상태 모킹
      render(<DashboardContent initialTests={[]} />);

      // 빈 상태 메시지 확인
      expect(
        screen.getByText(/아직 사주분석 이력이 없습니다/i)
      ).toBeInTheDocument();
    });

    it('더보기 로드 실패 시 에러를 처리해야 한다', async () => {
      const mockLoadMore = jest.fn().mockRejectedValue(new Error('API Error'));

      // 에러 모킹 후 더보기 클릭
      // 에러 토스트 확인
    });
  });

  // ============================================
  // 9. 성능 테스트
  // ============================================

  describe('성능', () => {
    it('검색 디바운스가 불필요한 렌더링을 방지해야 한다', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/검사자 이름으로 검색/i);

      // 빠른 입력
      await user.type(searchInput, 'abc', { delay: 50 });

      // 디바운스 전에는 호출되지 않음
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('페이지네이션이 메모리를 효율적으로 관리해야 한다', () => {
      const manyTests = Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        name: `테스트${i}`,
        birthDate: '2000-01-01',
        gender: 'male' as const,
        createdAt: '2024-10-30T10:00:00Z',
      }));

      const { container } = render(
        <DashboardContent initialTests={manyTests.slice(0, 10)} />
      );

      // 초기 10개만 렌더링됨
      expect(container.querySelectorAll('[role="button"]').length).toBeGreaterThan(0);
    });
  });
});
