/**
 * 토스페이먼츠 API 유틸리티 함수 (Server-side only)
 *
 * 빌링키 발급, 자동결제 승인, 빌링키 삭제 등의 서버 사이드 API 호출을 담당합니다.
 *
 * @see https://docs.tosspayments.com/guides/v2/billing
 */

import { serverEnv } from '@/constants/server-env';
import 'server-only';

const TOSS_API_BASE_URL = 'https://api.tosspayments.com/v1';

/**
 * 토스페이먼츠 API 에러
 */
export class TossPaymentsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'TossPaymentsError';
  }
}

/**
 * 시크릿 키를 Base64로 인코딩합니다.
 *
 * 토스페이먼츠 API는 Basic 인증을 사용하며,
 * "시크릿키:" 형식으로 인코딩해야 합니다.
 *
 * @returns Base64 인코딩된 시크릿 키
 * @throws 시크릿 키가 설정되지 않은 경우 에러 발생
 */
function getEncodedSecretKey(): string {
  if (!serverEnv.TOSS_SECRET_KEY) {
    throw new Error('TOSS_SECRET_KEY가 설정되지 않았습니다.');
  }

  return Buffer.from(`${serverEnv.TOSS_SECRET_KEY}:`).toString('base64');
}

/**
 * 토스페이먼츠 API를 호출합니다.
 *
 * @param endpoint - API 엔드포인트 (예: '/billing/authorizations/issue')
 * @param options - fetch 옵션
 * @returns API 응답 데이터
 * @throws API 호출 실패 시 TossPaymentsError 발생
 */
async function callTossAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const encodedKey = getEncodedSecretKey();
  const url = `${TOSS_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new TossPaymentsError(
      data.message || '토스페이먼츠 API 호출 실패',
      data.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data;
}

/**
 * 빌링키 발급 요청 파라미터
 */
export interface IssueBillingKeyRequest {
  /** 인증키 (카드 등록 성공 후 받은 authKey) */
  authKey: string;
  /** 고객 고유 키 (UUID 권장) */
  customerKey: string;
}

/**
 * 빌링키 발급 응답
 */
export interface IssueBillingKeyResponse {
  /** 빌링키 */
  billingKey: string;
  /** 카드 정보 */
  card?: {
    /** 카드 번호 (마스킹) */
    number: string;
    /** 카드 타입 (체크/신용) */
    cardType: string;
    /** 카드사 코드 */
    issuerCode: string;
    /** 카드사 이름 */
    issuerName: string;
    /** 카드 소유자 타입 (개인/법인) */
    ownerType: string;
  };
  /** 고객 키 */
  customerKey: string;
  /** 인증 날짜 */
  authenticatedAt: string;
}

/**
 * 빌링키를 발급합니다.
 *
 * authKey는 카드 등록 성공 후 successUrl의 쿼리 파라미터로 전달됩니다.
 *
 * @param request - 빌링키 발급 요청 파라미터
 * @returns 빌링키 및 카드 정보
 * @throws API 호출 실패 시 TossPaymentsError 발생
 *
 * @example
 * ```typescript
 * const response = await issueBillingKey({
 *   authKey: 'auth-key-from-success-url',
 *   customerKey: 'customer-uuid',
 * });
 *
 * console.log(response.billingKey); // 빌링키
 * console.log(response.card?.number); // 카드 번호 (마스킹)
 * ```
 */
export async function issueBillingKey(
  request: IssueBillingKeyRequest
): Promise<IssueBillingKeyResponse> {
  return callTossAPI<IssueBillingKeyResponse>(
    '/billing/authorizations/issue',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * 자동결제 승인 요청 파라미터
 */
export interface ChargeBillingRequest {
  /** 빌링키 */
  billingKey: string;
  /** 고객 키 */
  customerKey: string;
  /** 결제 금액 */
  amount: number;
  /** 주문 ID (고유값) */
  orderId: string;
  /** 주문명 */
  orderName: string;
  /** 고객 이메일 */
  customerEmail?: string;
  /** 고객 이름 */
  customerName?: string;
  /** 면세 금액 */
  taxFreeAmount?: number;
}

/**
 * 자동결제 승인 응답
 */
export interface ChargeBillingResponse {
  /** 결제 키 */
  paymentKey: string;
  /** 주문 ID */
  orderId: string;
  /** 결제 금액 */
  totalAmount: number;
  /** 상태 */
  status: string;
  /** 승인 날짜 */
  approvedAt: string;
}

/**
 * 빌링키로 자동결제를 승인합니다.
 *
 * @param request - 자동결제 승인 요청 파라미터
 * @returns 결제 결과
 * @throws API 호출 실패 시 TossPaymentsError 발생
 *
 * @example
 * ```typescript
 * const response = await chargeBilling({
 *   billingKey: 'billing-key',
 *   customerKey: 'customer-uuid',
 *   amount: 9900,
 *   orderId: `ORDER_${Date.now()}`,
 *   orderName: 'Pro 구독',
 *   customerEmail: 'user@example.com',
 * });
 *
 * console.log(response.paymentKey); // 결제 키
 * ```
 */
export async function chargeBilling(
  request: ChargeBillingRequest
): Promise<ChargeBillingResponse> {
  const { billingKey, ...body } = request;

  return callTossAPI<ChargeBillingResponse>(
    `/billing/${billingKey}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

/**
 * 빌링키 삭제 요청 파라미터
 */
export interface DeleteBillingKeyRequest {
  /** 빌링키 */
  billingKey: string;
  /** 고객 키 */
  customerKey: string;
}

/**
 * 빌링키를 삭제합니다.
 *
 * 구독 해지 시 빌링키를 삭제하여 더 이상 자동결제가 발생하지 않도록 합니다.
 *
 * @param request - 빌링키 삭제 요청 파라미터
 * @throws API 호출 실패 시 TossPaymentsError 발생
 *
 * @example
 * ```typescript
 * await deleteBillingKey({
 *   billingKey: 'billing-key',
 *   customerKey: 'customer-uuid',
 * });
 * ```
 */
export async function deleteBillingKey(
  request: DeleteBillingKeyRequest
): Promise<void> {
  const { billingKey, customerKey } = request;

  await callTossAPI<void>(
    `/billing/authorizations/${billingKey}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ customerKey }),
    }
  );
}

/**
 * 결제 취소 요청 파라미터
 */
export interface CancelPaymentRequest {
  /** 결제 키 */
  paymentKey: string;
  /** 취소 사유 */
  cancelReason: string;
  /** 취소 금액 (부분 취소 시 지정) */
  cancelAmount?: number;
}

/**
 * 결제를 취소(환불)합니다.
 *
 * @param request - 결제 취소 요청 파라미터
 * @returns 취소된 결제 정보
 * @throws API 호출 실패 시 TossPaymentsError 발생
 *
 * @example
 * ```typescript
 * // 전액 취소
 * await cancelPayment({
 *   paymentKey: 'payment-key',
 *   cancelReason: '고객 요청',
 * });
 *
 * // 부분 취소
 * await cancelPayment({
 *   paymentKey: 'payment-key',
 *   cancelReason: '부분 환불',
 *   cancelAmount: 5000,
 * });
 * ```
 */
export async function cancelPayment(
  request: CancelPaymentRequest
): Promise<any> {
  const { paymentKey, ...body } = request;

  return callTossAPI<any>(
    `/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}
