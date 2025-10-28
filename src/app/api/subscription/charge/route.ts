/**
 * 자동결제 승인 API
 *
 * 빌링키로 정기 결제를 실행합니다.
 * 빌링키 발급 후 첫 결제 및 Cron Job에서 정기 결제 시 호출됩니다.
 *
 * @route POST /api/subscription/charge
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { chargeBilling, TossPaymentsError } from '@/lib/toss-payments/api';
import { v4 as uuidv4 } from 'uuid';

/**
 * 자동결제 승인 요청 스키마
 */
interface ChargeRequest {
  billingKey: string;
  customerKey: string;
  amount: number;
  userId: string;
  subscriptionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 검증
    const body: ChargeRequest = await request.json();
    const { billingKey, customerKey, amount, userId, subscriptionId } = body;

    if (!billingKey || !customerKey || !amount || !userId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 주문 ID 생성
    const orderId = `ORDER_${Date.now()}_${uuidv4().slice(0, 8)}`;

    console.log('자동결제 승인 시작:', { userId, orderId, amount });

    // 3. 토스페이먼츠 API 호출
    const payment = await chargeBilling({
      billingKey,
      customerKey,
      amount,
      orderId,
      orderName: 'Vibe Fortune Pro 구독',
    });

    console.log('자동결제 승인 성공:', { paymentKey: payment.paymentKey });

    // 4. 결제 내역 저장
    const supabase = createAdminClient();

    // subscription_id 조회 (제공되지 않은 경우)
    let subId: string | undefined = subscriptionId;
    if (!subId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('billing_key', billingKey)
        .maybeSingle();

      subId = (subscription as any)?.id;
    }

    if (subId) {
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: userId,
        subscription_id: subId,
        payment_key: payment.paymentKey,
        order_id: orderId,
        amount,
        status: 'done',
        paid_at: new Date().toISOString(),
      } as any);

      if (paymentError) {
        console.error('결제 내역 저장 실패:', paymentError);
      } else {
        console.log('결제 내역 저장 완료:', { orderId });
      }
    }

    return NextResponse.json({
      success: true,
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
    });
  } catch (error: any) {
    console.error('자동결제 승인 실패:', error);

    // 토스페이먼츠 API 에러 처리
    if (error instanceof TossPaymentsError) {
      // 한도초과 또는 잔액부족 에러
      if (error.code === 'REJECT_CARD_PAYMENT') {
        return NextResponse.json(
          { error: '한도초과 또는 잔액부족입니다.', code: error.code },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // 일반 에러 처리
    return NextResponse.json(
      { error: error.message || '결제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
