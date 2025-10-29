import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
  console.log('--- E2E Global Setup: Starting Supabase services ---');
  try {
    // 로컬 Supabase 에뮬레이터 시작
    execSync('supabase start', { stdio: 'inherit' });
    // 데이터베이스 초기화 및 마이그레이션 적용
    execSync('supabase db reset --local', { stdio: 'inherit' });
    console.log('--- Supabase services started and database reset ---');
  } catch (error) {
    console.error('--- Failed to start Supabase or reset database: ---', error);
    process.exit(1);
  }
}

export default globalSetup;
