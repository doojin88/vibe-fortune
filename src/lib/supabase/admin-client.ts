import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { serverEnv } from '@/constants/server-env';
import { env } from '@/constants/env';
import 'server-only';

export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
