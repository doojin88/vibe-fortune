import { FullConfig } from '@playwright/test';

// NOTE: 글로벌 티어다운 역시 로컬 Supabase 중지 작업을 수행하지 않습니다.
async function globalTeardown(config: FullConfig) {
  console.log('--- E2E Global Teardown: No-op (no local services to stop) ---');
}

export default globalTeardown;
