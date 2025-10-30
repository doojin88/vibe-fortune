import { FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// NOTE: 로컬 Supabase 실행 금지 정책을 반영해, 글로벌 셋업은 환경변수 로드만 수행합니다.
// 실제 테스트 데이터 준비는 테스트 내부에서 HTTP 훅/시드 엔드포인트를 통해 처리하세요.
async function globalSetup(config: FullConfig) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
  console.log('--- E2E Global Setup: Skipping local Supabase start per project rules ---');
}

export default globalSetup;
