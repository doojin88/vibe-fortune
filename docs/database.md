# 데이터베이스 설계

## 개요

- 데이터베이스: Supabase (PostgreSQL)
- 인증: Clerk (Webhook을 통한 동기화)
- 설계 원칙: 최소 스펙, 유저플로우 기반

---

## 데이터 플로우

### 회원가입
```
사용자 → Clerk (Google OAuth) → user.created Webhook
→ /api/webhooks/clerk → Supabase users 테이블 INSERT
```

### 사주분석 생성
```
사용자 → 폼 입력 → Server Action → Gemini API
→ Supabase saju_tests 테이블 INSERT → 상세 페이지
```

### 사주분석 조회
```
사용자 → 대시보드 or 상세 페이지
→ Supabase SELECT (RLS로 본인 데이터만)
```

---

## 테이블 설계

### users

Clerk 사용자 정보 동기화 테이블 (Webhook으로만 관리)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | text | PK | Clerk user ID |
| email | text | NOT NULL, UNIQUE | 이메일 |
| name | text | NOT NULL | 이름 |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | 가입일시 |

```sql
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
```

### saju_tests

사주분석 데이터 및 결과 저장

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 분석 ID |
| user_id | text | NOT NULL, FK → users(id) | 사용자 ID |
| name | text | NOT NULL | 분석 대상 이름 |
| birth_date | date | NOT NULL | 생년월일 |
| birth_time | text | NULL | 출생시간 (HH:mm 형식, 선택) |
| gender | text | NOT NULL | 성별 (male/female) |
| result | text | NOT NULL | AI 분석 결과 (마크다운) |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | 분석 생성일시 |

```sql
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
```

---

## 인덱스

필수 인덱스만 생성 (쿼리 패턴 기반)

```sql
-- 대시보드: 사용자별 분석 목록 조회 (최신순)
CREATE INDEX idx_saju_tests_user_created
  ON saju_tests(user_id, created_at DESC);
```

PK와 UNIQUE는 자동 인덱스 생성되므로 별도 생성 불필요.

---

## Row Level Security (RLS)

### users 테이블

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Webhook에서만 생성/수정
CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "users_update_service"
  ON users FOR UPDATE
  TO service_role
  USING (true);
```

### saju_tests 테이블

```sql
ALTER TABLE saju_tests ENABLE ROW LEVEL SECURITY;

-- 본인 분석만 조회
CREATE POLICY "saju_select_own"
  ON saju_tests FOR SELECT
  USING (user_id = auth.uid());

-- 본인 분석만 생성
CREATE POLICY "saju_insert_own"
  ON saju_tests FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

---

## Clerk Webhook 연동

### 엔드포인트
`POST /api/webhooks/clerk`

### 처리 이벤트
- `user.created`: users 테이블 INSERT
- `user.updated`: users 테이블 UPDATE (email, name)

### 구현 예시
```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // RLS 우회
);

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(payload, headers);

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    await supabaseAdmin.from('users').insert({
      id,
      email: email_addresses[0].email_address,
      name: `${last_name}${first_name}`.trim() || email_addresses[0].email_address.split('@')[0],
    });
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    await supabaseAdmin.from('users').update({
      email: email_addresses[0].email_address,
      name: `${last_name}${first_name}`.trim() || email_addresses[0].email_address.split('@')[0],
    }).eq('id', id);
  }

  return Response.json({ success: true });
}
```

---

## 마이그레이션

### 전체 스크립트

```sql
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

---

## 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 서버 전용
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## 쿼리 예시

### 대시보드: 사주분석 목록 조회
```typescript
const { data } = await supabase
  .from('saju_tests')
  .select('id, name, birth_date, gender, created_at')
  .order('created_at', { ascending: false })
  .limit(10);
```

### 사주분석 상세 조회
```typescript
const { data } = await supabase
  .from('saju_tests')
  .select('*')
  .eq('id', analysisId)
  .single();
```

### 새 사주분석 생성
```typescript
const { data } = await supabase
  .from('saju_tests')
  .insert({
    user_id: userId,
    name: input.name,
    birth_date: input.birthDate,
    birth_time: input.birthTime || null,
    gender: input.gender,
    result: aiResult,
  })
  .select()
  .single();
```

---

## 주요 결정사항

1. **Clerk user ID는 text 타입**: UUID가 아닌 `user_xxx` 형식
2. **birth_time은 text 타입**: time 타입은 timezone 정보 없어 불필요한 복잡성 추가
3. **인덱스 최소화**: 실제 쿼리 패턴(user_id + created_at)에만 집중
4. **CHECK 제약 최소화**: 이메일 정규식 등은 애플리케이션에서 검증
5. **updated_at 불필요**: users는 webhook으로만 관리, saju_tests는 불변

---

## 문서 이력

| 버전 | 날짜 | 변경 내역 |
|------|------|----------|
| 2.0 | 2025-10-27 | 간결화 및 오버엔지니어링 제거 |
| 1.0 | 2025-10-27 | 초안 작성 |
