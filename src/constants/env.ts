import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

if (!_clientEnv.success) {
  console.warn('환경 변수 검증 실패:', _clientEnv.error.flatten().fieldErrors);
  console.warn('일부 기능이 제한될 수 있습니다.');
}

export const env: ClientEnv = _clientEnv.success ? _clientEnv.data : {};
