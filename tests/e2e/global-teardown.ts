import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalTeardown(config: FullConfig) {
  console.log('--- E2E Global Teardown: Stopping Supabase services ---');
  try {
    execSync('supabase stop', { stdio: 'inherit' });
    console.log('--- Supabase services stopped ---');
  } catch (error) {
    console.error('--- Failed to stop Supabase: ---', error);
  }
}

export default globalTeardown;
