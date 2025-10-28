/**
 * Cron Job 정기 결제 처리 API
 *
 * 매일 오전 2시 Supabase Cron에서 호출되어 정기 결제를 처리합니다.
 * - 오늘이 결제일인 활성 구독을 조회하여 결제 실행
 * - 결제 성공 시: 다음 결제일 업데이트 및 검사 횟수 충전
 * - 결제 실패 시: 구독 상태를 payment_failed로 변경
 * - 취소 예약 구독: 빌링키 삭제 및 해지 처리
 *
 * @route POST /api/subscription/process
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { deleteBillingKey } from '@/lib/toss-payments/api';
import { serverEnv } from '@/constants/server-env';
import { env } from '@/constants/env';

export async function POST(request: NextRequest) {
  try {
    // 1. Cron Secret 인증
    const cronSecret = request.headers.get('x-cron-secret');

    if (cronSecret !== serverEnv.CRON_SECRET) {
      console.error('Cron Secret 불일치');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron Job 시작:', new Date().toISOString());

    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 2. 오늘이 결제일인 활성 구독 조회
    const { data: subscriptions, error } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_billing_date', today);

    if (error) {
      console.error('구독 조회 실패:', error);
      throw error;
    }

    console.log(`처리할 구독 수: ${subscriptions?.length || 0}`);

    const results = [];

    // 3. 각 구독에 대해 결제 처리
    for (const subscription of subscriptions || []) {
      try {
        console.log(`구독 처리 시작: ${subscription.id}`);

        // 자동결제 API 호출
        const chargeResponse = await fetch(
          `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/charge`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              billingKey: subscription.billing_key,
              customerKey: subscription.customer_key,
              amount: 9900,
              userId: subscription.user_id,
              subscriptionId: subscription.id,
            }),
          }
        );

        if (chargeResponse.ok) {
          // 결제 성공
          console.log(`결제 성공: ${subscription.id}`);

          // 다음 결제일 업데이트 (30일 후)
          const nextBillingDate = new Date();
          nextBillingDate.setDate(nextBillingDate.getDate() + 30);

          await (supabase as any)
            .from('subscriptions')
            .update({
              last_billing_date: new Date().toISOString(),
              next_billing_date: nextBillingDate.toISOString(),
            })
            .eq('id', subscription.id);

          // 검사 횟수 충전
          await (supabase as any)
            .from('users')
            .update({ test_count: 10 })
            .eq('id', subscription.user_id);

          results.push({
            subscriptionId: subscription.id,
            success: true,
          });
        } else {
          // 결제 실패
          const errorData = await chargeResponse.json();
          console.error(`결제 실패: ${subscription.id}`, errorData);

          // 구독 상태를 payment_failed로 변경
          await (supabase as any)
            .from('subscriptions')
            .update({ status: 'payment_failed' })
            .eq('id', subscription.id);

          await (supabase as any)
            .from('users')
            .update({ subscription_status: 'payment_failed' })
            .eq('id', subscription.user_id);

          results.push({
            subscriptionId: subscription.id,
            success: false,
            error: errorData.error || 'Payment failed',
          });
        }
      } catch (error: any) {
        console.error(`구독 ${subscription.id} 처리 실패:`, error);
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
        });
      }
    }

    // 4. 취소 예약 구독 해지 처리
    const { data: cancelledSubscriptions } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('status', 'cancelled')
      .lt('next_billing_date', today);

    console.log(`해지할 구독 수: ${cancelledSubscriptions?.length || 0}`);

    for (const subscription of cancelledSubscriptions || []) {
      try {
        console.log(`구독 해지 시작: ${subscription.id}`);

        // 빌링키 삭제 (토스페이먼츠 API)
        await deleteBillingKey({
          billingKey: subscription.billing_key,
          customerKey: subscription.customer_key,
        });

        // 구독 상태를 terminated로 변경
        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'terminated',
            billing_key_deleted_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        // 사용자 상태를 free로 변경 및 검사 횟수 0으로 초기화
        await (supabase as any)
          .from('users')
          .update({
            subscription_status: 'free',
            test_count: 0,
          })
          .eq('id', subscription.user_id);

        console.log(`구독 해지 완료: ${subscription.id}`);
      } catch (error: any) {
        console.error(`구독 ${subscription.id} 해지 실패:`, error);
      }
    }

    console.log('Cron Job 완료:', {
      processed: results.length,
      terminated: cancelledSubscriptions?.length || 0,
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      terminated: cancelledSubscriptions?.length || 0,
    });
  } catch (error: any) {
    console.error('정기 결제 처리 실패:', error);
    return NextResponse.json(
      { error: error.message || '정기 결제 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
