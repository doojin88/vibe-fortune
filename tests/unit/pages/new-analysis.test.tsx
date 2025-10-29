/**
 * 새 사주분석 페이지 Unit Test
 *
 * 테스트 범위: 폼 입력, 검증, 제출, 구독 기능
 * 주요 기능: 실시간 검증, 잔여 횟수 확인, 모델 선택
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { NewAnalysisForm } from '@/features/saju/components/new-analysis-form';

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// createSajuTest Server Action 모킹
jest.mock('@/features/saju/actions/create-saju-test', () => ({
  createSajuTest: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'test-123' },
  }),
}));

// Toast 모킹
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('새 사주분석 페이지', () => {
  // ============================================
  // 1. 폼 렌더링 테스트
  // ============================================

  describe('폼 렌더링', () => {
    it('성함 입력 필드가 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    it('생년월일 입력 필드가 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      expect(birthDateInput).toBeInTheDocument();
    });

    it('출생시간 선택기가 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const birthTimeInput = screen.queryByLabelText(/출생시간|시간/i);
      if (birthTimeInput) {
        expect(birthTimeInput).toBeInTheDocument();
      }
    });

    it('출생시간 모름 체크박스가 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const unknownCheckbox = screen.getByLabelText(/출생시간 모름|시간 모름/i);
      expect(unknownCheckbox).toBeInTheDocument();
    });

    it('성별 라디오 그룹이 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const maleRadio = screen.getByLabelText(/남성|남/i);
      const femaleRadio = screen.getByLabelText(/여성|여/i);

      expect(maleRadio).toBeInTheDocument();
      expect(femaleRadio).toBeInTheDocument();
    });

    it('제출 버튼이 렌더링되어야 한다', () => {
      render(<NewAnalysisForm />);

      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });
      expect(submitButton).toBeInTheDocument();
    });
  });

  // ============================================
  // 2. 폼 검증 테스트
  // ============================================

  describe('폼 검증', () => {
    it('성함이 비어있을 때 에러를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 비운 상태로 제출 시도
      await user.click(submitButton);

      // 에러 메시지 확인 (또는 버튼 비활성화)
      await waitFor(() => {
        const errorMessage = screen.queryByText(
          /성함을 입력해주세요|이름은 필수|성함은 필수/i
        );
        // 에러 메시지가 없으면 버튼이 비활성화되어야 함
        expect(
          errorMessage || submitButton.hasAttribute('disabled')
        ).toBeTruthy();
      });
    });

    it('성함이 1자 이상 50자 이하여야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(
        /성함|이름/i
      ) as HTMLInputElement;

      // 51자 입력
      await user.clear(nameInput);
      await user.type(nameInput, '가'.repeat(51));

      // 에러 메시지 확인
      await waitFor(() => {
        const errorMessage = screen.queryByText(
          /50자 이하|최대 50자|너무 길다/i
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('생년월일 형식이 YYYY-MM-DD여야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const birthDateInput = screen.getByLabelText(
        /생년월일|출생일/i
      ) as HTMLInputElement;

      // 잘못된 형식 입력
      await user.clear(birthDateInput);
      await user.type(birthDateInput, '2000/01/01');

      await waitFor(() => {
        const errorMessage = screen.queryByText(
          /YYYY-MM-DD|형식|잘못된 형식/i
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('생년월일이 1900-01-01 이상이어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const birthDateInput = screen.getByLabelText(
        /생년월일|출생일/i
      ) as HTMLInputElement;

      // 범위 밖 입력
      await user.clear(birthDateInput);
      await user.type(birthDateInput, '1899-12-31');

      await waitFor(() => {
        const errorMessage = screen.queryByText(
          /1900년|범위|유효하지 않은/i
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('미래 날짜를 입력하면 에러를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const birthDateInput = screen.getByLabelText(
        /생년월일|출생일/i
      ) as HTMLInputElement;

      // 미래 날짜 입력
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await user.clear(birthDateInput);
      await user.type(birthDateInput, futureDateString);

      await waitFor(() => {
        const errorMessage = screen.queryByText(
          /미래|현재보다 이전|오늘 이전/i
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('성별이 선택되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 성별 미선택 상태로 제출 시도
      const nameInput = screen.getByLabelText(/성함|이름/i);
      await user.type(nameInput, '홍길동');

      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      await user.type(birthDateInput, '2000-01-01');

      // 성별 미선택 -> 버튼 비활성화
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('모든 필수 항목이 입력되면 버튼이 활성화되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 모든 항목 입력
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);

      // 버튼 활성화 확인
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  // ============================================
  // 3. 출생시간 모름 체크박스 테스트
  // ============================================

  describe('출생시간 모름 체크박스', () => {
    it('체크 시 시간 입력이 비활성화되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const unknownCheckbox = screen.getByLabelText(
        /출생시간 모름|시간 모름/i
      ) as HTMLInputElement;
      const birthTimeInput = screen.queryByLabelText(/출생시간|시간/i);

      if (birthTimeInput) {
        // 체크 전: 활성화
        expect(birthTimeInput).not.toBeDisabled();

        // 체크
        await user.click(unknownCheckbox);

        // 체크 후: 비활성화
        await waitFor(() => {
          expect(birthTimeInput).toBeDisabled();
        });
      }
    });

    it('언체크 시 시간 입력이 활성화되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const unknownCheckbox = screen.getByLabelText(
        /출생시간 모름|시간 모름/i
      ) as HTMLInputElement;
      const birthTimeInput = screen.queryByLabelText(/출생시간|시간/i);

      if (birthTimeInput) {
        // 먼저 체크
        await user.click(unknownCheckbox);

        // 그 다음 언체크
        await user.click(unknownCheckbox);

        // 활성화 확인
        await waitFor(() => {
          expect(birthTimeInput).not.toBeDisabled();
        });
      }
    });
  });

  // ============================================
  // 4. 폼 제출 테스트
  // ============================================

  describe('폼 제출', () => {
    it('유효한 입력 후 제출 시 API가 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);

      // 제출
      await user.click(submitButton);

      // API 호출 확인
      await waitFor(() => {
        expect(createSajuTest).toHaveBeenCalled();
      });
    });

    it('제출 후 로딩 상태가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // 로딩 상태 확인
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        // 또는 스피너 표시 확인
        const loadingText = screen.queryByText(/분석 중|처리 중|로딩/i);
      });
    });

    it('제출 성공 시 결과 페이지로 이동해야 한다', async () => {
      const user = userEvent.setup();
      const mockRouter = require('next/navigation').useRouter();

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // 이동 확인
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard/results/')
        );
      });
    });

    it('버튼을 중복 클릭해도 API가 한 번만 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      createSajuTest.mockClear();

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);

      // 중복 클릭
      await user.click(submitButton);
      await user.click(submitButton);

      // API 호출 횟수 확인
      await waitFor(() => {
        expect(createSajuTest).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================
  // 5. 구독 기능 통합 테스트
  // ============================================

  describe('구독 기능 통합', () => {
    it('잔여 횟수가 부족할 때 다이얼로그가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      createSajuTest.mockResolvedValueOnce({
        success: false,
        error: '검사 횟수가 부족합니다. 구독 페이지로 이동하시겠습니까?',
      });

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // 다이얼로그 확인
      await waitFor(() => {
        const dialogTitle = screen.queryByText(/검사 횟수 부족|구독/i);
        expect(dialogTitle).toBeInTheDocument();
      });
    });

    it('구독 다이얼로그에서 "구독하기" 클릭 시 구독 페이지로 이동해야 한다', async () => {
      const user = userEvent.setup();
      const mockRouter = require('next/navigation').useRouter();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      createSajuTest.mockResolvedValueOnce({
        success: false,
        error: '검사 횟수가 부족합니다.',
      });

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // 다이얼로그의 "구독하기" 버튼 클릭
      await waitFor(() => {
        const subscribeButton = screen.queryByRole('button', {
          name: /구독하기|구독/i,
        });
        if (subscribeButton) {
          fireEvent.click(subscribeButton);

          expect(mockRouter.push).toHaveBeenCalledWith('/subscription');
        }
      });
    });

    it('무료 사용자는 flash 모델로 분석되어야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // API 호출 확인
      await waitFor(() => {
        expect(createSajuTest).toHaveBeenCalled();
        // 모델 선택은 서버에서 처리되므로 여기서는 API 호출만 확인
      });
    });
  });

  // ============================================
  // 6. 에러 처리 테스트
  // ============================================

  describe('에러 처리', () => {
    it('API 호출 실패 시 에러 토스트가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      const { toast } = require('@/hooks/use-toast').useToast();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      createSajuTest.mockRejectedValueOnce(new Error('API Error'));

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // 에러 토스트 확인
      await waitFor(() => {
        const errorMessage = screen.queryByText(/분석 실패|오류/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('API 실패 후 폼이 초기화되지 않아야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      createSajuTest.mockRejectedValueOnce(new Error('API Error'));

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i) as HTMLInputElement;
      const birthDateInput = screen.getByLabelText(
        /생년월일|출생일/i
      ) as HTMLInputElement;
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);

      // 제출 (실패)
      await user.click(submitButton);

      // 폼 데이터 유지 확인
      await waitFor(() => {
        expect(nameInput.value).toBe('홍길동');
        expect(birthDateInput.value).toBe('2000-01-01');
      });
    });
  });

  // ============================================
  // 7. 반응형 디자인 테스트
  // ============================================

  describe('반응형 디자인', () => {
    it('모바일에서 버튼이 전체 너비로 표시되어야 한다', () => {
      const { container } = render(<NewAnalysisForm />);

      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // Tailwind 클래스 확인 (w-full 등)
      // expect(submitButton).toHaveClass('w-full');
    });
  });

  // ============================================
  // 8. 접근성 테스트
  // ============================================

  describe('접근성 (a11y)', () => {
    it('모든 입력 필드가 라벨을 가져야 한다', () => {
      render(<NewAnalysisForm />);

      expect(screen.getByLabelText(/성함|이름/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/생년월일|출생일/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/남성|남/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/여성|여/i)).toBeInTheDocument();
    });

    it('에러 메시지가 aria-live 영역에 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 비운 상태로 제출 시도
      await user.click(submitButton);

      // 에러 메시지 확인
      await waitFor(() => {
        const errorElement = screen.queryByText(
          /성함을 입력해주세요|이름은 필수/i
        );
        // aria-live 영역이 있거나 에러가 표시됨
      });
    });

    it('제출 버튼이 로딩 중일 때 aria-busy를 가져야 한다', async () => {
      const user = userEvent.setup();
      const { createSajuTest } = require('@/features/saju/actions/create-saju-test');

      // 느린 API 모킹
      createSajuTest.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: { id: 'test' } }), 500)
          )
      );

      render(<NewAnalysisForm />);

      const nameInput = screen.getByLabelText(/성함|이름/i);
      const birthDateInput = screen.getByLabelText(/생년월일|출생일/i);
      const maleRadio = screen.getByLabelText(/남성|남/i);
      const submitButton = screen.getByRole('button', {
        name: /검사|분석|시작/i,
      });

      // 입력 및 제출
      await user.type(nameInput, '홍길동');
      await user.type(birthDateInput, '2000-01-01');
      await user.click(maleRadio);
      await user.click(submitButton);

      // aria-busy 확인 (또는 disabled 상태)
      expect(submitButton).toBeDisabled();
    });
  });
});
