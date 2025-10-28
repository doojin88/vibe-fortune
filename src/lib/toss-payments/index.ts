/**
 * 토스페이먼츠 SDK 클라이언트 (Client Component용)
 *
 * 자동결제(빌링) 연동을 위한 클라이언트 사이드 SDK 래퍼
 * 빌링키 발급을 위한 카드 등록 UI를 제공합니다.
 *
 * @see https://docs.tosspayments.com/sdk/v2/js
 */

'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { env } from '@/constants/env';

let tossPaymentsPromise: Promise<any> | null = null;

/**
 * 토스페이먼츠 SDK 인스턴스를 가져옵니다.
 *
 * 싱글톤 패턴으로 구현되어 있어 여러 번 호출해도 한 번만 초기화됩니다.
 *
 * @returns 토스페이먼츠 SDK 인스턴스
 * @throws 클라이언트 키가 설정되지 않은 경우 에러 발생
 */
export async function getTossPayments() {
  if (!env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
    throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.');
  }

  if (!tossPaymentsPromise) {
    tossPaymentsPromise = loadTossPayments(env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
  }

  return tossPaymentsPromise;
}

/**
 * 결제 인스턴스를 생성합니다.
 *
 * @param customerKey - 고객 고유 키 (UUID 권장)
 * @returns 결제 인스턴스
 */
export async function createPayment(customerKey: string) {
  const tossPayments = await getTossPayments();
  return tossPayments.payment({ customerKey });
}

/**
 * 빌링 인증 요청 파라미터
 */
export interface BillingAuthRequest {
  /** 결제 수단 (카드만 지원) */
  method: 'CARD';
  /** 성공 시 리다이렉트 URL */
  successUrl: string;
  /** 실패 시 리다이렉트 URL */
  failUrl: string;
  /** 고객 이메일 */
  customerEmail?: string;
  /** 고객 이름 */
  customerName?: string;
}

/**
 * 카드 등록을 위한 빌링 인증을 요청합니다.
 *
 * @param customerKey - 고객 고유 키 (UUID 권장)
 * @param request - 빌링 인증 요청 파라미터
 * @throws 사용자가 취소하거나 에러 발생 시 예외 발생
 *
 * @example
 * ```typescript
 * try {
 *   await requestBillingAuth('customer-uuid', {
 *     method: 'CARD',
 *     successUrl: `${window.location.origin}/subscription/success`,
 *     failUrl: `${window.location.origin}/subscription/fail`,
 *     customerEmail: 'user@example.com',
 *     customerName: '홍길동',
 *   });
 * } catch (error) {
 *   if (error.code === 'USER_CANCEL') {
 *     console.log('사용자가 취소했습니다.');
 *   }
 * }
 * ```
 */
export async function requestBillingAuth(
  customerKey: string,
  request: BillingAuthRequest
) {
  const payment = await createPayment(customerKey);
  return payment.requestBillingAuth(request);
}
