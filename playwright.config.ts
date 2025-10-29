import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.SUPABASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'supabase-e2e',
      testMatch: /.*\.test\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),
});
