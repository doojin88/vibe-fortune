import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.test 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test.describe('Saju Test Flow E2E', () => {
  // 각 테스트 전 데이터베이스 클린업
  test.beforeEach(async () => {
    // 모든 사주 테스트 데이터를 삭제하여 독립적인 테스트 환경 보장
    await supabase.from('saju_tests').delete().gt('id', '');
    await supabase.from('payments').delete().gt('id', '');
    await supabase.from('subscriptions').delete().gt('id', '');
    await supabase.from('users').delete().gt('id', '');
  });

  test('should allow a user to create a saju test and verify data', async () => {
    // 1. 사용자 생성
    const userId = 'e2e-test-user-1';
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'e2e@example.com',
        name: 'E2E Test User',
      })
      .select()
      .single();

    expect(userError).toBeNull();
    expect(userData).toBeDefined();
    expect(userData?.id).toBe(userId);
    expect(userData?.email).toBe('e2e@example.com');
    expect(userData?.name).toBe('E2E Test User');
    expect(userData?.subscription_status).toBe('free');
    expect(userData?.test_count).toBe(3);

    // 2. 사주 테스트 생성
    const { data: sajuData, error: sajuError } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '홍길동',
        birth_date: '1990-01-01',
        gender: 'male',
        result: '테스트 사주 분석 결과입니다.',
        model_used: 'flash',
      })
      .select()
      .single();

    expect(sajuError).toBeNull();
    expect(sajuData).toBeDefined();
    expect(sajuData?.user_id).toBe(userId);
    expect(sajuData?.name).toBe('홍길동');
    expect(sajuData?.birth_date).toBe('1990-01-01');
    expect(sajuData?.gender).toBe('male');
    expect(sajuData?.model_used).toBe('flash');
  });

  test('should create multiple saju tests for a user', async () => {
    // 1. 사용자 생성
    const userId = 'e2e-test-user-2';
    await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'e2e2@example.com',
        name: 'Test User 2',
      })
      .select();

    // 2. 첫 번째 사주 테스트 생성
    const { data: saju1 } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '김영희',
        birth_date: '1995-05-15',
        gender: 'female',
        result: '첫 번째 분석 결과',
        model_used: 'flash',
      })
      .select()
      .single();

    // 3. 두 번째 사주 테스트 생성
    const { data: saju2 } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '이순신',
        birth_date: '1992-03-20',
        gender: 'male',
        result: '두 번째 분석 결과',
        model_used: 'flash',
      })
      .select()
      .single();

    // 4. 사용자의 모든 사주 테스트 조회
    const { data: sajuTests, error } = await supabase
      .from('saju_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(sajuTests).toBeDefined();
    expect(sajuTests?.length).toBe(2);
    expect(sajuTests?.[0].id).toBe(saju2?.id);
    expect(sajuTests?.[1].id).toBe(saju1?.id);
  });

  test('should handle user with subscription status', async () => {
    // 1. Pro 구독자 생성
    const userId = 'e2e-test-pro-user';
    const { data: userData } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'pro@example.com',
        name: 'Pro User',
        subscription_status: 'pro',
        test_count: 0, // Pro 사용자는 무제한
      })
      .select()
      .single();

    expect(userData?.subscription_status).toBe('pro');
    expect(userData?.test_count).toBe(0);

    // 2. Pro 모델을 사용한 사주 테스트 생성
    const { data: sajuData } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '세종대왕',
        birth_date: '1397-05-15',
        gender: 'male',
        result: 'Pro 모델을 사용한 심화 분석',
        model_used: 'pro',
      })
      .select()
      .single();

    expect(sajuData?.model_used).toBe('pro');
  });

  test('should validate gender field correctly', async () => {
    const userId = 'e2e-test-user-3';
    await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'e2e3@example.com',
        name: 'Test User 3',
      })
      .select();

    // 유효한 성별 (male)
    const { error: maleError } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '테스트',
        birth_date: '1990-01-01',
        gender: 'male',
        result: '결과',
        model_used: 'flash',
      })
      .select();

    expect(maleError).toBeNull();

    // 유효한 성별 (female)
    const { error: femaleError } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '테스트2',
        birth_date: '1991-02-02',
        gender: 'female',
        result: '결과2',
        model_used: 'flash',
      })
      .select();

    expect(femaleError).toBeNull();
  });

  test('should verify user-saju relationship with CASCADE delete', async () => {
    // 1. 사용자 및 사주 테스트 생성
    const userId = 'e2e-test-user-4';
    await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'e2e4@example.com',
        name: 'Test User 4',
      })
      .select();

    const { data: saju1 } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '테스트1',
        birth_date: '1990-01-01',
        gender: 'male',
        result: '결과1',
        model_used: 'flash',
      })
      .select()
      .single();

    const { data: saju2 } = await supabase
      .from('saju_tests')
      .insert({
        user_id: userId,
        name: '테스트2',
        birth_date: '1991-02-02',
        gender: 'female',
        result: '결과2',
        model_used: 'flash',
      })
      .select()
      .single();

    // 2. 사용자 삭제 (CASCADE로 인해 관련 사주 테스트도 삭제되어야 함)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    expect(deleteError).toBeNull();

    // 3. 사주 테스트가 실제로 삭제되었는지 확인
    const { data: remainingSaju } = await supabase
      .from('saju_tests')
      .select('*')
      .eq('user_id', userId);

    expect(remainingSaju?.length).toBe(0);
  });
});
