# Clerk Google Authentication Guide

## 개요
Clerk를 사용한 Next.js 15 (App Router) Google OAuth 인증 및 사용자 관리 가이드

---

## 1. 필수 패키지 설치

```bash
npm install @clerk/nextjs@latest svix
```

- `@clerk/nextjs`: Clerk Next.js SDK
- `svix`: Webhook 서명 검증용

---

## 2. Clerk Middleware 설정

**파일 위치**: `middleware.ts` (프로젝트 루트 또는 `src/` 디렉토리)

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**중요**:
- ✅ 사용: `clerkMiddleware()` (최신 버전)
- ❌ 사용 금지: `authMiddleware()` (구버전)

---

## 3. ClerkProvider 설정

**파일**: `app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## 4. Google 로그인 UI 컴포넌트

### 4.1 기본 컴포넌트

```typescript
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}
```

### 4.2 제공 컴포넌트
- `<SignInButton>`: 로그인 버튼
- `<SignUpButton>`: 회원가입 버튼
- `<UserButton>`: 사용자 프로필 버튼
- `<SignedIn>`: 로그인 상태일 때만 렌더링
- `<SignedOut>`: 로그아웃 상태일 때만 렌더링

---

## 5. Clerk Dashboard 설정

### 5.1 Google OAuth 활성화
1. [Clerk Dashboard](https://dashboard.clerk.com/) 로그인
2. Application 선택
3. **User & Authentication** > **Social Connections**
4. **Google** 활성화
5. 자동 생성된 OAuth 키 사용 또는 커스텀 앱 연결

### 5.2 환경 변수
Clerk가 자동으로 키를 생성하므로 별도로 설정할 필요 없음

```bash
# Clerk가 자동 생성 (Dashboard에서 확인 가능)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 6. 서버에서 사용자 정보 접근

### 6.1 userId만 필요할 때

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // userId 사용
}
```

### 6.2 전체 사용자 정보 필요할 때

```typescript
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.emailAddresses[0].emailAddress;
  const name = `${user.firstName} ${user.lastName}`;
  // 사용자 정보 사용
}
```

**중요**:
- `@clerk/nextjs/server`에서 import (서버 전용)
- `async/await` 필수 사용
- `@clerk/nextjs`는 클라이언트 컴포넌트용

---

## 7. Webhook으로 사용자 동기화

### 7.1 Webhook 엔드포인트

**파일**: `app/api/webhooks/clerk/route.ts`

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error('CLERK_WEBHOOK_SECRET not set');

  // 헤더 검증
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return Response.json({ error: 'Missing headers' }, { status: 400 });
  }

  // 요청 본문
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 서명 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  // 이벤트 처리
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    // 데이터베이스에 사용자 생성
    await createUser({
      clerk_user_id: id,
      email: email_addresses[0].email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      profile_image_url: image_url,
    });
  }

  if (eventType === 'user.updated') {
    // 사용자 정보 업데이트
  }

  if (eventType === 'user.deleted') {
    // 사용자 삭제
  }

  return Response.json({ received: true }, { status: 200 });
}
```

### 7.2 Webhook Dashboard 설정

**배포 후 설정**:
1. 애플리케이션 배포하여 공개 URL 확보
2. [Clerk Dashboard](https://dashboard.clerk.com/) > **Webhooks**
3. **Add Endpoint** 클릭
4. Endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
5. 이벤트 선택:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. **Signing Secret** 복사 후 환경 변수에 저장

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

**중요**:
- Webhook은 배포 환경에서만 작동
- 로컬 테스트 시 ngrok 등 터널링 필요
- `svix` 패키지로 서명 검증 필수
- Webhook 실패 시 Clerk가 자동 재시도

---

## 8. 주의사항 및 베스트 프랙티스

### ✅ 반드시 지켜야 할 사항

1. **최신 미들웨어 사용**
   - `clerkMiddleware()` 사용 (구버전 `authMiddleware()` 사용 금지)

2. **올바른 import 경로**
   - 서버 API: `@clerk/nextjs/server`
   - 클라이언트 컴포넌트: `@clerk/nextjs`

3. **async/await 사용**
   - `auth()`, `currentUser()`는 반드시 async 함수에서 await와 함께 사용

4. **Webhook 서명 검증**
   - `svix` 패키지로 모든 Webhook 요청 검증 필수

5. **App Router 사용**
   - `app/` 디렉토리 구조 사용
   - Pages Router (`pages/`, `_app.tsx`) 사용 금지

### ❌ 피해야 할 사항

1. **구버전 API 사용**
   - `authMiddleware()` 사용 금지
   - `withAuth` 사용 금지

2. **Pages Router 패턴**
   - `pages/signin.js` 같은 구조 사용 금지
   - `_app.tsx`에서 Clerk 설정 금지

3. **환경 변수 수동 설정**
   - Clerk가 자동으로 키 생성하므로 수동 설정 불필요

---

## 9. 환경 변수 정리

```bash
# Clerk (자동 생성)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # 클라이언트용 공개 키
CLERK_SECRET_KEY=sk_test_...                   # 서버용 비밀 키

# Clerk Webhook (배포 후 설정)
CLERK_WEBHOOK_SECRET=whsec_...                 # Webhook 서명 검증용
```

---

## 10. 참고 자료

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Clerk Webhook Guide](https://clerk.com/docs/integrations/webhooks)
- [Google OAuth Setup](https://clerk.com/blog/raw/nextjs-google-authentication)
- [Clerk AI Prompts](https://clerk.com/docs/guides/development/ai-prompts)
