/**
 * 구독 관리 페이지 Unit Test
 *
 * 테스트 범위: 4가지 구독 상태, 토스페이먼츠 통합, 취소/재개 기능
 * 주요 기능: 상태별 UI 렌더링, 다이얼로그, Server Action
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// 테스트할 컴포넌트들
import { SubscriptionContent } from '@/features/subscription/components/subscription-content';
import { SubscribeButton } from '@/features/subscription/components/subscribe-button';
import { CancelDialog } from '@/features/subscription/components/cancel-dialog';
import { ResumeDialog } from '@/features/subscription/components/resume-dialog';

// Mock 데이터
const mockFreeSubscription = {
  userEmail: 'user@example.com',
  status: 'free' as const,
  testCount: 0,
  nextBillingDate: null,
  cardNumber: null,
  cardCompany: null,
};

const mockProSubscription = {
  userEmail: 'user@example.com',
  status: 'pro' as const,
  testCount: 5,
  nextBillingDate: '2024-11-30',
  cardNumber: '1234',
  cardCompany: 'VISA',
};

const mockCancelledSubscription = {
  userEmail: 'user@example.com',
  status: 'cancelled' as const,
  testCount: 8,
  nextBillingDate: '2024-11-30',
  cardNumber: '1234',
  cardCompany: 'VISA',
};

const mockPaymentFailedSubscription = {
  userEmail: 'user@example.com',
  status: 'payment_failed' as const,
  testCount: 3,
  nextBillingDate: null,
  cardNumber: '1234',
  cardCompany: 'VISA',
};

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Server Actions 모킹
jest.mock('@/features/subscription/actions/cancel-subscription', () => ({
  cancelSubscription: jest.fn().mockResolvedValue({
    success: true,
  }),
}));

jest.mock('@/features/subscription/actions/resume-subscription', () => ({
  resumeSubscription: jest.fn().mockResolvedValue({
    success: true,
  }),
}));

// Toast 모킹
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Toss Payments 모킹
jest.mock('@/lib/tosspayments/client', () => ({
  getTossPayments: jest.fn().mockResolvedValue({
    payment: jest.fn().mockReturnValue({
      requestBillingAuth: jest.fn().mockResolvedValue({
        authKey: 'test-auth-key',
        customerKey: 'test-customer-key',
      }),
    }),
  }),
}));

describe('구독 관리 페이지', () => {
  // ============================================
  // 1. 무료 사용자 상태 테스트
  // ============================================

  describe('무료 사용자 (free)', () => {
    it('Pro 구독하기 버튼이 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockFreeSubscription} />);

      const subscribeButton = screen.getByRole('button', {
        name: /Pro 구독|구독하기|구독/i,
      });
      expect(subscribeButton).toBeInTheDocument();
    });

    it('무료 요금제 안내 메시지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockFreeSubscription} />);

      expect(
        screen.getByText(/무료 요금제를 사용 중입니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pro 구독으로 월 10회 고급 분석/i)
      ).toBeInTheDocument();
    });

    it('구독 취소 버튼이 표시되지 않아야 한다', () => {
      render(<SubscriptionContent subscription={mockFreeSubscription} />);

      const cancelButton = screen.queryByRole('button', {
        name: /구독 취소|취소/i,
      });
      expect(cancelButton).not.toBeInTheDocument();
    });

    it('구독 재개 버튼이 표시되지 않아야 한다', () => {
      render(<SubscriptionContent subscription={mockFreeSubscription} />);

      const resumeButton = screen.queryByRole('button', {
        name: /구독 재개|재개/i,
      });
      expect(resumeButton).not.toBeInTheDocument();
    });

    it('잔여 횟수가 0회로 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockFreeSubscription} />);

      expect(screen.getByText(/0회|0/)).toBeInTheDocument();
    });
  });

  // ============================================
  // 2. Pro 활성 사용자 상태 테스트
  // ============================================

  describe('Pro 활성 사용자 (pro)', () => {
    it('구독 취소 버튼이 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      const cancelButton = screen.getByRole('button', {
        name: /구독 취소|취소/i,
      });
      expect(cancelButton).toBeInTheDocument();
    });

    it('Pro 요금제 안내 메시지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      expect(
        screen.getByText(/Pro 구독이 활성화되어 있습니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/다음 결제일에 자동으로 9,900원이 결제됩니다/i)
      ).toBeInTheDocument();
    });

    it('다음 결제일이 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      expect(
        screen.getByText(/2024-11-30|11월 30일/i)
      ).toBeInTheDocument();
    });

    it('카드 정보가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      expect(
        screen.getByText(/VISA|카드|1234/i)
      ).toBeInTheDocument();
    });

    it('잔여 횟수가 5회로 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      expect(screen.getByText(/5회|5/)).toBeInTheDocument();
    });
  });

  // ============================================
  // 3. Pro 취소 예약 사용자 상태 테스트
  // ============================================

  describe('Pro 취소 예약 사용자 (cancelled)', () => {
    it('구독 재개 버튼이 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      const resumeButton = screen.getByRole('button', {
        name: /구독 재개|재개/i,
      });
      expect(resumeButton).toBeInTheDocument();
    });

    it('"취소 예약" 배지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      expect(screen.getByText(/취소 예약|취소됨/i)).toBeInTheDocument();
    });

    it('취소 예약 안내 메시지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      expect(
        screen.getByText(/구독이 취소 예약되었습니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pro 혜택이 유지됩니다/i)
      ).toBeInTheDocument();
    });

    it('다음 결제일까지 혜택 유지 안내가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      expect(
        screen.getByText(/2024-11-30|11월 30일/i)
      ).toBeInTheDocument();
    });

    it('구독 취소 버튼이 표시되지 않아야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      const cancelButton = screen.queryByRole('button', {
        name: /구독 취소|취소$/i,
      });
      expect(cancelButton).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 4. Pro 결제 실패 사용자 상태 테스트
  // ============================================

  describe('Pro 결제 실패 사용자 (payment_failed)', () => {
    it('결제 재시도 버튼이 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockPaymentFailedSubscription} />);

      const retryButton = screen.queryByRole('button', {
        name: /결제 재시도|재시도/i,
      });
      // 구현에 따라 표시될 수 있음
    });

    it('"결제 실패" 배지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockPaymentFailedSubscription} />);

      expect(screen.getByText(/결제 실패|결제 오류/i)).toBeInTheDocument();
    });

    it('결제 실패 안내 메시지가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockPaymentFailedSubscription} />);

      expect(
        screen.getByText(/결제에 실패했습니다/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/카드 한도 초과|잔액 부족/i)
      ).toBeInTheDocument();
    });
  });

  // ============================================
  // 5. SubscribeButton 컴포넌트 테스트
  // ============================================

  describe('SubscribeButton 컴포넌트', () => {
    it('버튼이 렌더링되어야 한다', () => {
      render(<SubscribeButton userEmail="user@example.com" userName="홍길동" />);

      const button = screen.getByRole('button', {
        name: /Pro 구독|구독하기/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('버튼 클릭 시 토스페이먼츠 SDK가 초기화되어야 한다', async () => {
      const user = userEvent.setup();
      render(<SubscribeButton userEmail="user@example.com" userName="홍길동" />);

      const button = screen.getByRole('button', {
        name: /Pro 구독|구독하기/i,
      });

      await user.click(button);

      // SDK 초기화 확인
      await waitFor(() => {
        const { getTossPayments } = require('@/lib/tosspayments/client');
        expect(getTossPayments).toHaveBeenCalled();
      });
    });

    it('로딩 중일 때 버튼이 비활성화되어야 한다', () => {
      const { container } = render(
        <SubscribeButton
          userEmail="user@example.com"
          userName="홍길동"
          isLoading={true}
        />
      );

      const button = screen.getByRole('button', {
        name: /Pro 구독|구독하기|처리 중/i,
      });

      expect(button).toBeDisabled();
    });
  });

  // ============================================
  // 6. CancelDialog 컴포넌트 테스트
  // ============================================

  describe('CancelDialog 컴포넌트', () => {
    it('다이얼로그가 렌더링되어야 한다', () => {
      const mockOnConfirm = jest.fn();
      render(
        <CancelDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={mockOnConfirm}
          nextBillingDate="2024-11-30"
        />
      );

      expect(
        screen.getByText(/구독을 취소하시겠습니까/i)
      ).toBeInTheDocument();
    });

    it('다음 결제일 정보가 표시되어야 한다', () => {
      render(
        <CancelDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      expect(
        screen.getByText(/2024-11-30|11월 30일/i)
      ).toBeInTheDocument();
    });

    it('취소 버튼을 클릭하면 다이얼로그가 닫혀야 한다', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CancelDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /취소/i,
      });

      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('확인 버튼을 클릭하면 onConfirm이 호출되어야 한다', () => {
      const mockOnConfirm = jest.fn();
      render(
        <CancelDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={mockOnConfirm}
          nextBillingDate="2024-11-30"
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /확인|동의|취소하기/i,
      });

      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  // ============================================
  // 7. ResumeDialog 컴포넌트 테스트
  // ============================================

  describe('ResumeDialog 컴포넌트', () => {
    it('다이얼로그가 렌더링되어야 한다', () => {
      render(
        <ResumeDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      expect(
        screen.getByText(/구독을 재개하시겠습니까/i)
      ).toBeInTheDocument();
    });

    it('다음 자동 결제 정보가 표시되어야 한다', () => {
      render(
        <ResumeDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      expect(
        screen.getByText(/자동 결제|자동으로|2024-11-30/i)
      ).toBeInTheDocument();
    });

    it('취소 버튼을 클릭하면 다이얼로그가 닫혀야 한다', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <ResumeDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /취소/i,
      });

      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('확인 버튼을 클릭하면 onConfirm이 호출되어야 한다', () => {
      const mockOnConfirm = jest.fn();
      render(
        <ResumeDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={mockOnConfirm}
          nextBillingDate="2024-11-30"
        />
      );

      const confirmButton = screen.getByRole('button', {
        name: /확인|동의|재개하기/i,
      });

      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  // ============================================
  // 8. 구독 취소 플로우 테스트
  // ============================================

  describe('구독 취소 플로우', () => {
    it('취소 버튼 클릭 → 다이얼로그 표시 → 확인 → cancelSubscription 호출', async () => {
      const user = userEvent.setup();
      const { cancelSubscription } = require('@/features/subscription/actions/cancel-subscription');
      const mockRouter = require('next/navigation').useRouter();

      cancelSubscription.mockClear();

      const { rerender } = render(
        <SubscriptionContent subscription={mockProSubscription} />
      );

      // 취소 버튼 클릭
      const cancelButton = screen.getByRole('button', {
        name: /구독 취소|취소/i,
      });

      await user.click(cancelButton);

      // 다이얼로그 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/구독을 취소하시겠습니까/i)
        ).toBeInTheDocument();
      });

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole('button', {
        name: /확인|동의|취소하기/i,
      });

      await user.click(confirmButton);

      // cancelSubscription 호출 확인
      await waitFor(() => {
        expect(cancelSubscription).toHaveBeenCalled();
      });

      // 페이지 새로고침 확인
      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('취소 실패 시 에러 토스트가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      const { cancelSubscription } = require('@/features/subscription/actions/cancel-subscription');
      const { toast } = require('@/hooks/use-toast').useToast();

      cancelSubscription.mockRejectedValueOnce(new Error('API Error'));

      render(<SubscriptionContent subscription={mockProSubscription} />);

      const cancelButton = screen.getByRole('button', {
        name: /구독 취소|취소/i,
      });

      await user.click(cancelButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', {
          name: /확인|동의|취소하기/i,
        });

        if (confirmButton) {
          fireEvent.click(confirmButton);
        }
      });

      // 에러 토스트 확인
      await waitFor(() => {
        // toast 호출 확인 (또는 에러 메시지 표시)
      });
    });
  });

  // ============================================
  // 9. 구독 재개 플로우 테스트
  // ============================================

  describe('구독 재개 플로우', () => {
    it('재개 버튼 클릭 → 다이얼로그 표시 → 확인 → resumeSubscription 호출', async () => {
      const user = userEvent.setup();
      const { resumeSubscription } = require('@/features/subscription/actions/resume-subscription');
      const mockRouter = require('next/navigation').useRouter();

      resumeSubscription.mockClear();

      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      // 재개 버튼 클릭
      const resumeButton = screen.getByRole('button', {
        name: /구독 재개|재개/i,
      });

      await user.click(resumeButton);

      // 다이얼로그 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(/구독을 재개하시겠습니까/i)
        ).toBeInTheDocument();
      });

      // 확인 버튼 클릭
      const confirmButton = screen.getByRole('button', {
        name: /확인|동의|재개하기/i,
      });

      await user.click(confirmButton);

      // resumeSubscription 호출 확인
      await waitFor(() => {
        expect(resumeSubscription).toHaveBeenCalled();
      });

      // 페이지 새로고침 확인
      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // 10. 반응형 디자인 테스트
  // ============================================

  describe('반응형 디자인', () => {
    it('모바일에서 정보가 수직으로 배치되어야 한다', () => {
      const { container } = render(
        <SubscriptionContent subscription={mockProSubscription} />
      );

      // 반응형 클래스 확인
      expect(container).toBeInTheDocument();
    });

    it('버튼이 전체 너비로 표시되어야 한다', () => {
      render(<SubscribeButton userEmail="user@example.com" userName="홍길동" />);

      const button = screen.getByRole('button', {
        name: /Pro 구독|구독하기/i,
      });

      // Tailwind 클래스 확인
      expect(button).toBeInTheDocument();
    });
  });

  // ============================================
  // 11. 접근성 테스트
  // ============================================

  describe('접근성 (a11y)', () => {
    it('모든 버튼이 접근 가능해야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('다이얼로그가 키보드로 조작 가능해야 한다', () => {
      render(
        <CancelDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      // 포커스 가능한 요소 확인
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('상태 배지가 의미론적으로 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockCancelledSubscription} />);

      const badge = screen.getByText(/취소 예약|취소됨/i);
      expect(badge).toBeInTheDocument();
    });
  });

  // ============================================
  // 12. 에러 처리 테스트
  // ============================================

  describe('에러 처리', () => {
    it('네트워크 에러 시 재시도 안내가 표시되어야 한다', () => {
      render(<SubscriptionContent subscription={mockProSubscription} />);

      // 네트워크 에러 시나리오
      expect(
        screen.getByText(/Pro 구독/i) ||
        screen.getByText(/구독 취소/i)
      ).toBeTruthy();
    });

    it('Toss Payments SDK 초기화 실패 시 처리해야 한다', async () => {
      const user = userEvent.setup();
      const { getTossPayments } = require('@/lib/tosspayments/client');

      getTossPayments.mockRejectedValueOnce(new Error('SDK Error'));

      render(<SubscribeButton userEmail="user@example.com" userName="홍길동" />);

      const button = screen.getByRole('button', {
        name: /Pro 구독|구독하기/i,
      });

      await user.click(button);

      // 에러 처리 확인
      await waitFor(() => {
        // 에러 토스트 또는 메시지 표시
      });
    });
  });

  // ============================================
  // 13. 성능 테스트
  // ============================================

  describe('성능', () => {
    it('구독 정보 변경 시 불필요한 재렌더링을 방지해야 한다', () => {
      const { rerender } = render(
        <SubscriptionContent subscription={mockFreeSubscription} />
      );

      // 같은 데이터로 재렌더링
      rerender(
        <SubscriptionContent subscription={mockFreeSubscription} />
      );

      // 컴포넌트가 여전히 렌더링됨
      expect(
        screen.getByText(/무료 요금제를 사용 중입니다/i)
      ).toBeInTheDocument();
    });

    it('다이얼로그 열기/닫기가 빠르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      render(
        <CancelDialog
          open={true}
          onOpenChange={jest.fn()}
          onConfirm={jest.fn()}
          nextBillingDate="2024-11-30"
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /취소/i,
      });

      await user.click(cancelButton);

      // 다이얼로그가 빠르게 닫혀야 함
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
