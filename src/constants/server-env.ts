import { z } from 'zod';
import 'server-only';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(), // 배포 후에만 필요
  TOSS_SECRET_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

const _serverEnv = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

if (!_serverEnv.success) {
  console.warn('서버 환경 변수 검증 실패:', _serverEnv.error.flatten().fieldErrors);
  console.warn('일부 기능이 제한될 수 있습니다.');
}

export const serverEnv: ServerEnv = _serverEnv.success ? _serverEnv.data : {};
