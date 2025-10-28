/**
 * 빌링키 발급 및 첫 결제 API
 *
 * 카드 등록 후 authKey를 받아 빌링키를 발급하고,
 * 첫 결제를 진행한 후 구독 정보를 저장합니다.
 *
 * @route POST /api/subscription/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { issueBillingKey, TossPaymentsError } from '@/lib/toss-payments/api';
import { env } from '@/constants/env';
import type { Database } from '@/lib/supabase/types';

/**
 * 빌링키 발급 요청 스키마
 */
interface ConfirmRequest {
  authKey: string;
  customerKey: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 데이터 검증
    const body: ConfirmRequest = await request.json();
    const { authKey, customerKey } = body;

    if (!authKey || !customerKey) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 3. 빌링키 발급
    console.log('빌링키 발급 시작:', { userId, customerKey });
    const billingData = await issueBillingKey({ authKey, customerKey });

    // 4. Supabase에 구독 정보 저장
    const supabase = createAdminClient();

    // 기존 구독이 있는지 확인
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: '이미 활성화된 구독이 있습니다.' },
        { status: 400 }
      );
    }

    // 다음 결제일: 현재로부터 30일 후
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        billing_key: billingData.billingKey,
        customer_key: customerKey,
        card_number: billingData.card?.number?.slice(-4) || null,
        card_type: billingData.card?.cardType || null,
        card_company: billingData.card?.issuerName || null,
        status: 'active',
        next_billing_date: nextBillingDate.toISOString(),
      } as any)
      .select()
      .single();

    if (dbError || !subscription) {
      console.error('구독 정보 저장 실패:', dbError);
      throw new Error('구독 정보 저장에 실패했습니다.');
    }

    // 5. 첫 결제 진행
    const sub = subscription as any;
    console.log('첫 결제 시작:', { subscriptionId: sub.id });

    const chargeResponse = await fetch(
      `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingKey: billingData.billingKey,
          customerKey,
          amount: 9900,
          userId,
          subscriptionId: sub.id,
        }),
      }
    );

    if (!chargeResponse.ok) {
      // 첫 결제 실패 시 구독 삭제
      console.error('첫 결제 실패');
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', sub.id);

      throw new Error('첫 결제에 실패했습니다.');
    }

    // 6. users 테이블 업데이트
    const adminSupabase = createAdminClient();
    const { error: userError } = await (adminSupabase as any)
      .from('users')
      .update({
        subscription_status: 'pro',
        test_count: 10,
      })
      .eq('id', userId);

    if (userError) {
      console.error('사용자 정보 업데이트 실패:', userError);
    }

    console.log('구독 등록 완료:', { userId, subscriptionId: sub.id });

    return NextResponse.json({
      success: true,
      message: '구독이 성공적으로 등록되었습니다.',
    });
  } catch (error: any) {
    console.error('빌링키 발급 실패:', error);

    // 토스페이먼츠 API 에러 처리
    if (error instanceof TossPaymentsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // 일반 에러 처리
    return NextResponse.json(
      { error: error.message || '빌링키 발급에 실패했습니다.' },
      { status: 500 }
    );
  }
}
