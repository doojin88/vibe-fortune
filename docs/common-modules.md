# 공통 모듈 작업 계획

## 문서 개요

본 문서는 Vibe Fortune 프로젝트의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈 및 로직을 정의합니다. 모든 공통 모듈은 특정 페이지에 의존적이지 않으며, 여러 페이지에서 재사용 가능하도록 설계됩니다.

**작성 원칙:**
- 문서(PRD, userflow, database)에 명시된 내용만 구현
- 오버엔지니어링 금지
- 페이지 단위 병렬 개발이 가능하도록 코드 conflict 최소화

---

## 1. 데이터베이스 스키마 및 타입

### 1.1 Supabase Database Types

**필요한 이유:**
- 데이터베이스 테이블 스키마를 TypeScript 타입으로 정의하여 타입 안정성 확보
- Supabase 클라이언트 사용 시 자동완성 및 타입 체크
- users, saju_tests 테이블의 타입 정의 필요

**구현 방법:**
```typescript
// src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      saju_tests: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time: string | null;
          gender: 'male' | 'female';
          result: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time?: string | null;
          gender: 'male' | 'female';
          result: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          birth_date?: string;
          birth_time?: string | null;
          gender?: 'male' | 'female';
          result?: string;
          created_at?: string;
        };
      };
    };
  };
};

export type SajuTest = Database['public']['Tables']['saju_tests']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
```

**사용될 곳:**
- Supabase 클라이언트 생성 시 제네릭 타입
- 모든 데이터베이스 쿼리
- Server Actions
- 페이지 컴포넌트 props

**우선순위:** 최고 (P0) - 모든 데이터베이스 접근에 필수

---

### 1.2 Supabase 마이그레이션 스크립트

**필요한 이유:**
- Supabase 데이터베이스 초기 테이블 및 RLS 정책 설정
- 로컬 개발 환경 및 배포 환경 동일 스키마 보장

**구현 방법:**
```sql
-- supabase/migrations/20251027000000_initial_schema.sql
-- users 테이블
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- saju_tests 테이블
CREATE TABLE saju_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  birth_time text,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_saju_tests_user_created
  ON saju_tests(user_id, created_at DESC);

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_tests ENABLE ROW LEVEL SECURITY;

-- users 정책
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "users_update_service"
  ON users FOR UPDATE
  TO service_role
  USING (true);

-- saju_tests 정책
CREATE POLICY "saju_select_own"
  ON saju_tests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "saju_insert_own"
  ON saju_tests FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**사용될 곳:**
- Supabase 프로젝트 초기 세팅
- 로컬 개발 환경 (supabase start)

**우선순위:** 최고 (P0) - 데이터베이스 없이는 개발 불가

---

## 2. 환경 변수 관리

### 2.1 서버 전용 환경 변수

**필요한 이유:**
- Gemini API 키, Supabase Service Role Key 등 민감 정보 관리
- 클라이언트에 노출되면 안되는 환경 변수 타입 정의 및 검증

**구현 방법:**
```typescript
// src/constants/server-env.ts
import { z } from 'zod';
import 'server-only';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(), // 배포 후에만 필요
});

const _serverEnv = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

if (!_serverEnv.success) {
  console.error('서버 환경 변수 검증 실패:', _serverEnv.error.flatten().fieldErrors);
  throw new Error('서버 환경 변수를 확인하세요.');
}

export const serverEnv: ServerEnv = _serverEnv.data;
```

**사용될 곳:**
- Gemini API 호출 (Server Actions)
- Clerk Webhook 처리
- Supabase Service Role Client 생성

**우선순위:** 최고 (P0) - AI 분석 기능에 필수

---

## 3. 공통 타입 정의

### 3.1 사주분석 입력 타입 및 Validation Schema

**필요한 이유:**
- 새 검사하기 폼 입력 데이터 타입 정의
- 클라이언트/서버 양쪽에서 동일한 검증 로직 사용

**구현 방법:**
```typescript
// src/features/saju/types/input.ts
import { z } from 'zod';

export const sajuInputSchema = z.object({
  name: z.string().min(1, '성함을 입력해주세요').max(50, '성함은 50자 이하로 입력해주세요'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  birthTimeUnknown: z.boolean().default(false),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: '성별을 선택해주세요' }),
  }),
});

export type SajuInput = z.infer<typeof sajuInputSchema>;
```

**사용될 곳:**
- 새 검사하기 페이지 폼 검증
- Server Action 입력 검증
- Gemini API 프롬프트 생성

**우선순위:** 최고 (P0) - 사주분석 기능의 핵심

---

### 3.2 사주분석 결과 타입

**필요한 이유:**
- 데이터베이스에서 조회한 사주분석 데이터의 타입 정의
- 컴포넌트 props 타입 체크

**구현 방법:**
```typescript
// src/features/saju/types/result.ts
export type SajuTestResult = {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  gender: 'male' | 'female';
  result: string; // 마크다운 텍스트
  createdAt: string;
};

export type SajuTestListItem = Pick<
  SajuTestResult,
  'id' | 'name' | 'birthDate' | 'gender' | 'createdAt'
> & {
  preview: string; // result의 첫 100자
};
```

**사용될 곳:**
- 대시보드 이력 카드
- 사주분석 상세 페이지
- Server Components props

**우선순위:** 높음 (P1)

---

## 4. Supabase 클라이언트 유틸리티

### 4.1 Supabase Browser Client 헬퍼

**필요한 이유:**
- 클라이언트 컴포넌트에서 Supabase 사용
- 현재 코드베이스에 이미 일부 구현되어 있으나, Database 타입 업데이트 필요

**구현 방법:**
```typescript
// src/lib/supabase/browser-client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { env } from '@/constants/env';

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**사용될 곳:**
- 클라이언트 컴포넌트에서 데이터 조회 (거의 사용 안함, 주로 Server Components 사용)
- React Query mutations (필요 시)

**우선순위:** 중간 (P2) - Server Components 위주 사용

---

### 4.2 Supabase Server Client 헬퍼

**필요한 이유:**
- Server Components와 Server Actions에서 Supabase 사용
- 쿠키 기반 인증 세션 관리

**구현 방법:**
```typescript
// src/lib/supabase/server-client.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { env } from '@/constants/env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서는 쿠키 설정 불가, 무시
          }
        },
      },
    }
  );
}
```

**사용될 곳:**
- 모든 Server Components
- Server Actions
- 대시보드, 사주분석 상세 페이지 데이터 로딩

**우선순위:** 최고 (P0) - 모든 데이터 접근에 필수

---

### 4.3 Supabase Admin Client

**필요한 이유:**
- Clerk Webhook에서 RLS 우회하여 users 테이블 INSERT/UPDATE
- Service Role Key 사용

**구현 방법:**
```typescript
// src/lib/supabase/admin-client.ts
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
```

**사용될 곳:**
- Clerk Webhook 핸들러 (`/api/webhooks/clerk`)

**우선순위:** 높음 (P1) - Webhook 구현에 필수

---

## 5. Gemini API 연동

### 5.1 Gemini API Client

**필요한 이유:**
- Google Gemini API 호출 로직 캡슐화
- 에러 처리 및 재시도 로직 중앙화

**구현 방법:**
```typescript
// src/lib/gemini/client.ts
import { serverEnv } from '@/constants/server-env';
import 'server-only';

export type GeminiResponse = {
  text: string;
};

export class GeminiClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API 호출 실패: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다');
    }

    return { text };
  }
}

export const geminiClient = new GeminiClient(serverEnv.GEMINI_API_KEY);
```

**사용될 곳:**
- 사주분석 Server Action
- AI 프롬프트 생성 후 호출

**우선순위:** 최고 (P0) - 사주분석 기능의 핵심

---

### 5.2 사주분석 프롬프트 생성

**필요한 이유:**
- 사용자 입력을 기반으로 일관된 AI 프롬프트 생성
- 프롬프트 품질 관리 및 수정 용이성

**구현 방법:**
```typescript
// src/lib/gemini/prompts.ts
import type { SajuInput } from '@/features/saju/types/input';
import 'server-only';

export function generateSajuPrompt(input: SajuInput): string {
  const birthTimeText = input.birthTime || '미상';
  const genderText = input.gender === 'male' ? '남성' : '여성';

  return `당신은 20년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: ${input.name}
- 생년월일: ${input.birthDate}
- 출생시간: ${birthTimeText}
- 성별: ${genderText}

**분석 요구사항**:
다음 섹션을 포함하여 상세한 사주분석 결과를 마크다운 형식으로 작성해주세요:

1. **천간(天干)과 지지(地支)**: 생년월일시의 사주팔자를 계산하고 해석
2. **오행(五行) 분석**: 목(木), 화(火), 토(土), 금(金), 수(水)의 균형 분석
3. **대운(大運)과 세운(歲運)**: 인생의 흐름과 현재 운세
4. **성격 분석**: 타고난 성격, 장단점, 대인관계 성향
5. **재운 분석**: 재물운, 재테크 성향, 직업 적성
6. **건강운 분석**: 주의해야 할 건강 부위, 건강 관리 조언
7. **연애운 분석**: 이성관계, 결혼운, 배우자 성향

**출력 형식**: 마크다운

**금지 사항**:
- 의료·법률 조언 금지
- 확정적 미래 예측 금지
- 부정적·공격적 표현 금지

각 섹션은 명확한 제목(## 또는 ###)으로 구분하고, 이해하기 쉽게 작성해주세요.`;
}
```

**사용될 곳:**
- 사주분석 Server Action

**우선순위:** 최고 (P0)

---

## 6. Server Actions

### 6.1 사주분석 생성 Action

**필요한 이유:**
- 새 검사하기 폼 제출 시 AI 분석 실행 및 데이터베이스 저장
- 클라이언트-서버 간 안전한 통신

**구현 방법:**
```typescript
// src/features/saju/actions/create-saju-test.ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server-client';
import { geminiClient } from '@/lib/gemini/client';
import { generateSajuPrompt } from '@/lib/gemini/prompts';
import { sajuInputSchema, type SajuInput } from '@/features/saju/types/input';

export type CreateSajuTestResult =
  | { success: true; testId: string }
  | { success: false; error: string };

export async function createSajuTest(
  input: SajuInput
): Promise<CreateSajuTestResult> {
  try {
    // 1. 입력 검증
    const validatedInput = sajuInputSchema.parse(input);

    // 2. 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // 3. AI 프롬프트 생성
    const prompt = generateSajuPrompt(validatedInput);

    // 4. Gemini API 호출
    const { text: result } = await geminiClient.generateContent(prompt);

    // 5. 데이터베이스 저장
    const { data: sajuTest, error: dbError } = await supabase
      .from('saju_tests')
      .insert({
        user_id: user.id,
        name: validatedInput.name,
        birth_date: validatedInput.birthDate,
        birth_time: validatedInput.birthTime || null,
        gender: validatedInput.gender,
        result,
      })
      .select()
      .single();

    if (dbError || !sajuTest) {
      console.error('데이터베이스 저장 실패:', dbError);
      return { success: false, error: '분석 결과 저장에 실패했습니다' };
    }

    // 6. 상세 페이지로 리다이렉트
    redirect(`/dashboard/results/${sajuTest.id}`);
  } catch (error) {
    console.error('사주분석 생성 실패:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: '분석 중 오류가 발생했습니다' };
  }
}
```

**사용될 곳:**
- 새 검사하기 페이지 폼 제출

**우선순위:** 최고 (P0)

---

### 6.2 사주분석 목록 조회 함수

**필요한 이유:**
- 대시보드에서 사주분석 이력 목록 조회
- Server Component에서 직접 호출

**구현 방법:**
```typescript
// src/features/saju/queries/get-saju-tests.ts
import { createClient } from '@/lib/supabase/server-client';
import type { SajuTestListItem } from '@/features/saju/types/result';
import 'server-only';

export async function getSajuTests(limit = 10): Promise<SajuTestListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saju_tests')
    .select('id, name, birth_date, gender, result, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('사주분석 목록 조회 실패:', error);
    return [];
  }

  return data.map((test) => ({
    id: test.id,
    name: test.name,
    birthDate: test.birth_date,
    gender: test.gender as 'male' | 'female',
    createdAt: test.created_at,
    preview: test.result.slice(0, 100) + '...',
  }));
}
```

**사용될 곳:**
- 대시보드 페이지

**우선순위:** 최고 (P0)

---

### 6.3 사주분석 상세 조회 함수

**필요한 이유:**
- 사주분석 상세 페이지에서 특정 분석 결과 조회
- 본인 분석만 접근 가능 (RLS 적용)

**구현 방법:**
```typescript
// src/features/saju/queries/get-saju-test.ts
import { createClient } from '@/lib/supabase/server-client';
import type { SajuTestResult } from '@/features/saju/types/result';
import 'server-only';

export async function getSajuTest(
  id: string
): Promise<SajuTestResult | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('saju_tests')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    console.error('사주분석 조회 실패:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    gender: data.gender as 'male' | 'female',
    result: data.result,
    createdAt: data.created_at,
  };
}
```

**사용될 곳:**
- 사주분석 상세 페이지

**우선순위:** 최고 (P0)

---

## 7. Clerk 인증 연동

### 7.1 Clerk Middleware 설정

**필요한 이유:**
- 보호된 페이지 접근 제어
- 현재 middleware.ts는 Supabase Auth 기반이므로 Clerk로 전환 필요

**구현 방법:**
```typescript
// middleware.ts (수정)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**사용될 곳:**
- 모든 페이지 요청
- `/dashboard/*` 경로 보호

**우선순위:** 최고 (P0) - 인증 없이 개발 불가

---

### 7.2 Clerk Webhook 핸들러

**필요한 이유:**
- Clerk 사용자 정보를 Supabase users 테이블에 동기화
- `user.created`, `user.updated` 이벤트 처리

**구현 방법:**
```typescript
// src/app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { serverEnv } from '@/constants/server-env';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = serverEnv.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // 헤더 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // 페이로드 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhook 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook 검증 실패:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const supabase = createAdminClient();

  // user.created 이벤트 처리
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [last_name, first_name].filter(Boolean).join('') || email?.split('@')[0] || 'Unknown';

    const { error } = await supabase.from('users').insert({
      id,
      email: email || '',
      name,
    });

    if (error) {
      console.error('사용자 생성 실패:', error);
      return new Response('User creation failed', { status: 500 });
    }
  }

  // user.updated 이벤트 처리
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [last_name, first_name].filter(Boolean).join('') || email?.split('@')[0] || 'Unknown';

    const { error } = await supabase
      .from('users')
      .update({
        email: email || '',
        name,
      })
      .eq('id', id);

    if (error) {
      console.error('사용자 업데이트 실패:', error);
      return new Response('User update failed', { status: 500 });
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
```

**사용될 곳:**
- Clerk에서 자동 호출 (배포 후)

**우선순위:** 높음 (P1) - 배포 후 필수

---

### 7.3 Clerk 환경 변수 추가

**필요한 이유:**
- Clerk 인증 설정
- 환경 변수 검증

**구현 방법:**
```bash
# .env.local (추가)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

```typescript
// src/constants/env.ts (수정)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1), // 추가
});
```

```typescript
// src/constants/server-env.ts (수정)
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1), // 추가
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
});
```

**사용될 곳:**
- 모든 Clerk 관련 기능

**우선순위:** 최고 (P0)

---

## 8. 공통 UI 컴포넌트

### 8.1 마크다운 렌더러

**필요한 이유:**
- AI 분석 결과(마크다운)를 HTML로 렌더링
- 일관된 스타일 적용

**구현 방법:**
```typescript
// src/components/markdown-renderer.tsx
'use client';

import ReactMarkdown from 'react-markdown';

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

```bash
# 패키지 설치
pnpm add react-markdown
```

**사용될 곳:**
- 사주분석 상세 페이지

**우선순위:** 최고 (P0)

---

### 8.2 로딩 스피너 컴포넌트

**필요한 이유:**
- AI 분석 중 로딩 상태 표시
- 일관된 로딩 UI

**구현 방법:**
```typescript
// src/components/ui/spinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpinnerProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
    />
  );
}
```

**사용될 곳:**
- 새 검사하기 페이지 (분석 중)
- 페이지 로딩 상태

**우선순위:** 높음 (P1)

---

### 8.3 Date Picker 컴포넌트

**필요한 이유:**
- 생년월일 입력 UX 개선
- shadcn/ui 기반 구현

**구현 방법:**
```typescript
// src/components/ui/date-picker.tsx
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜를 선택하세요',
  disabled,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP', { locale: ko }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={ko}
          disabled={(date) =>
            date > new Date() || date < new Date('1900-01-01')
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
```

```bash
# 패키지 설치
pnpm add date-fns react-day-picker
npx shadcn@latest add calendar popover
```

**사용될 곳:**
- 새 검사하기 페이지 (생년월일 입력)

**우선순위:** 높음 (P1)

---

### 8.4 Time Picker 컴포넌트

**필요한 이유:**
- 출생시간 입력 UX 개선
- 시간 선택 UI

**구현 방법:**
```typescript
// src/components/ui/time-picker.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TimePickerProps = {
  value?: string;
  onChange?: (time: string) => void;
  disabled?: boolean;
};

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [hour, setHour] = React.useState('');
  const [minute, setMinute] = React.useState('');

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '');
      setMinute(m || '');
    }
  }, [value]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const numVal = parseInt(val, 10);

    if (val === '' || (numVal >= 0 && numVal <= 23)) {
      setHour(val);
      if (val.length === 2 && minute) {
        onChange?.(`${val.padStart(2, '0')}:${minute.padStart(2, '0')}`);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const numVal = parseInt(val, 10);

    if (val === '' || (numVal >= 0 && numVal <= 59)) {
      setMinute(val);
      if (hour && val.length === 2) {
        onChange?.(`${hour.padStart(2, '0')}:${val.padStart(2, '0')}`);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Input
          type="text"
          placeholder="00"
          value={hour}
          onChange={handleHourChange}
          disabled={disabled}
          className="w-16 text-center"
          maxLength={2}
        />
        <Label>시</Label>
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          placeholder="00"
          value={minute}
          onChange={handleMinuteChange}
          disabled={disabled}
          className="w-16 text-center"
          maxLength={2}
        />
        <Label>분</Label>
      </div>
    </div>
  );
}
```

**사용될 곳:**
- 새 검사하기 페이지 (출생시간 입력)

**우선순위:** 높음 (P1)

---

### 8.5 Empty State 컴포넌트

**필요한 이유:**
- 대시보드에 이력이 없을 때 표시
- 일관된 빈 상태 UI

**구현 방법:**
```typescript
// src/components/ui/empty-state.tsx
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
```

**사용될 곳:**
- 대시보드 (이력 없을 때)

**우선순위:** 중간 (P2)

---

## 9. 공통 레이아웃 컴포넌트

### 9.1 대시보드 헤더

**필요한 이유:**
- 대시보드, 새 검사, 상세 페이지에서 공통 사용
- 로고, 네비게이션, 사용자 프로필 버튼

**구임 방법:**
```typescript
// src/components/layout/dashboard-header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

const navItems = [
  { label: '대시보드', href: '/dashboard' },
  { label: '새 검사', href: '/dashboard/new' },
];

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Vibe Fortune</span>
        </Link>
        <nav className="flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
```

**사용될 곳:**
- 대시보드 레이아웃 (`/dashboard/layout.tsx`)

**우선순위:** 최고 (P0)

---

### 9.2 홈 헤더

**필요한 이유:**
- 홈 페이지 헤더 (로그인 상태에 따라 버튼 변경)

**구현 방법:**
```typescript
// src/components/layout/home-header.tsx
'use client';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Vibe Fortune</span>
        </Link>
        <nav className="flex items-center gap-6 flex-1">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            서비스
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            가격
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            FAQ
          </Link>
        </nav>
        <SignedOut>
          <SignInButton mode="modal">
            <Button>시작하기</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button>이용하기</Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
```

**사용될 곳:**
- 홈 페이지 (`/page.tsx`)

**우선순위:** 높음 (P1)

---

## 10. 공통 유틸리티 함수

### 10.1 날짜 포맷팅

**필요한 이유:**
- 일관된 날짜 표시 형식
- 생년월일, 분석 날짜 등

**구현 방법:**
```typescript
// src/lib/utils/date.ts
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern = 'yyyy년 MM월 dd일'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ko });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
}

export function formatBirthDate(date: string): string {
  return formatDate(date, 'yyyy-MM-dd');
}
```

**사용될 곳:**
- 대시보드 이력 카드
- 사주분석 상세 페이지

**우선순위:** 중간 (P2)

---

### 10.2 클립보드 복사

**필요한 이유:**
- 사주분석 결과 복사 기능
- 브라우저 호환성 처리

**구현 방법:**
```typescript
// src/lib/utils/clipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 폴백: textarea 사용
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
}
```

**사용될 곳:**
- 사주분석 상세 페이지 (결과 복사 버튼)

**우선순위:** 중간 (P2)

---

## 11. 설치 필요 패키지

### 11.1 Clerk 관련

```bash
pnpm add @clerk/nextjs svix
```

**우선순위:** 최고 (P0)

---

### 11.2 마크다운 렌더링

```bash
pnpm add react-markdown
```

**우선순위:** 최고 (P0)

---

### 11.3 Date Picker 관련

```bash
pnpm add date-fns react-day-picker
npx shadcn@latest add calendar popover
```

**우선순위:** 높음 (P1)

---

## 12. 구현 우선순위 요약

### P0 (최고 우선순위 - 즉시 구현)

1. Supabase Database Types (`src/lib/supabase/types.ts`)
2. Supabase 마이그레이션 실행
3. 서버 환경 변수 설정 (`src/constants/server-env.ts`)
4. Clerk 환경 변수 추가 및 Middleware 수정
5. 사주분석 입력 타입 및 Validation (`src/features/saju/types/input.ts`)
6. Supabase Server Client 헬퍼 (`src/lib/supabase/server-client.ts`)
7. Gemini API Client (`src/lib/gemini/client.ts`)
8. 사주분석 프롬프트 생성 (`src/lib/gemini/prompts.ts`)
9. 사주분석 생성 Server Action (`src/features/saju/actions/create-saju-test.ts`)
10. 사주분석 목록/상세 조회 함수 (`src/features/saju/queries/`)
11. 마크다운 렌더러 (`src/components/markdown-renderer.tsx`)
12. 대시보드 헤더 (`src/components/layout/dashboard-header.tsx`)

### P1 (높은 우선순위 - 조기 구현)

1. Supabase Admin Client (`src/lib/supabase/admin-client.ts`)
2. Clerk Webhook 핸들러 (`src/app/api/webhooks/clerk/route.ts`)
3. Date Picker 컴포넌트
4. Time Picker 컴포넌트
5. 로딩 스피너 컴포넌트
6. 홈 헤더
7. 사주분석 결과 타입

### P2 (중간 우선순위 - 필요 시 구현)

1. Supabase Browser Client (거의 사용 안함)
2. Empty State 컴포넌트
3. 날짜 포맷팅 유틸리티
4. 클립보드 복사 유틸리티

---

## 13. 디렉토리 구조

```
src/
├── lib/
│   ├── supabase/
│   │   ├── types.ts (P0)
│   │   ├── server-client.ts (P0)
│   │   ├── admin-client.ts (P1)
│   │   └── browser-client.ts (P2)
│   ├── gemini/
│   │   ├── client.ts (P0)
│   │   └── prompts.ts (P0)
│   └── utils/
│       ├── date.ts (P2)
│       └── clipboard.ts (P2)
├── features/
│   └── saju/
│       ├── types/
│       │   ├── input.ts (P0)
│       │   └── result.ts (P1)
│       ├── actions/
│       │   └── create-saju-test.ts (P0)
│       └── queries/
│           ├── get-saju-tests.ts (P0)
│           └── get-saju-test.ts (P0)
├── components/
│   ├── layout/
│   │   ├── dashboard-header.tsx (P0)
│   │   └── home-header.tsx (P1)
│   ├── ui/
│   │   ├── date-picker.tsx (P1)
│   │   ├── time-picker.tsx (P1)
│   │   ├── spinner.tsx (P1)
│   │   └── empty-state.tsx (P2)
│   └── markdown-renderer.tsx (P0)
├── constants/
│   ├── env.ts (수정, P0)
│   └── server-env.ts (P0)
├── app/
│   └── api/
│       └── webhooks/
│           └── clerk/
│               └── route.ts (P1)
└── middleware.ts (수정, P0)
```

---

## 14. 작업 순서 권장사항

1. **Phase 1: 기반 설정 (P0)**
   - Supabase 마이그레이션 실행
   - 환경 변수 설정 (Clerk, Gemini)
   - Clerk Middleware 수정
   - Database Types 정의

2. **Phase 2: 핵심 로직 (P0)**
   - Supabase Server Client 헬퍼
   - Gemini API Client 및 프롬프트
   - 사주분석 Server Actions 및 Queries
   - 마크다운 렌더러

3. **Phase 3: 공통 UI (P0-P1)**
   - 헤더 컴포넌트 (Home, Dashboard)
   - Date/Time Picker
   - 로딩 스피너

4. **Phase 4: Webhook 및 부가 기능 (P1)**
   - Clerk Webhook 핸들러
   - Admin Client

5. **Phase 5: 선택적 유틸리티 (P2)**
   - Empty State
   - 날짜 포맷팅, 클립보드 복사

---

## 15. 검증 체크리스트

각 모듈 구현 후 다음 사항을 확인하세요:

- [ ] TypeScript 컴파일 에러 없음
- [ ] 환경 변수 검증 통과
- [ ] Supabase 연결 테스트 성공
- [ ] Clerk 인증 플로우 정상 작동
- [ ] Gemini API 호출 테스트 성공
- [ ] Database 마이그레이션 적용 완료
- [ ] RLS 정책 테스트 (본인 데이터만 접근)
- [ ] Webhook 테스트 (배포 후)

---

## 16. 주의사항

1. **Clerk vs Supabase Auth 충돌 방지**
   - 현재 코드베이스는 Supabase Auth 사용 중
   - Clerk로 전환 시 middleware.ts 완전 교체 필요
   - `src/features/auth/` 디렉토리는 Clerk 사용 시 불필요할 수 있음 (확인 필요)

2. **RLS 정책 주의**
   - Service Role Key는 RLS 우회하므로 Webhook에서만 사용
   - 일반 데이터 조회는 Anon Key 사용 (RLS 적용)

3. **환경 변수 보안**
   - `NEXT_PUBLIC_*`은 클라이언트 노출
   - API 키는 절대 `NEXT_PUBLIC_` 접두사 사용 금지

4. **TypeScript Strict Mode**
   - 모든 타입은 명시적으로 정의
   - `any` 타입 사용 금지

5. **Server-only 패키지 사용**
   - 서버 전용 코드에는 `import 'server-only'` 추가
   - 클라이언트에서 실수로 import 시 빌드 에러 발생

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
