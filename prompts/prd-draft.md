# 요구사항 정의서 (Requirement Document)

## 1. 프로젝트 개요

### 1.1 목적
Clerk, Supabase, 토스페이먼츠를 연동한 구독형 사주 분석 서비스 구현

### 1.2 핵심 가치
- Clerk 로그인 기반 사용자 인증
- 무료/유료 구독 모델을 통한 차등화된 서비스 제공
- Gemini AI 기반 사주팔자 분석
- 자동 정기 결제 시스템

---

## 2. 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | 풀스택 웹 애플리케이션 |
| 인증 | Clerk | 로그인, 세션 관리, Webhook |
| 데이터베이스 | Supabase (PostgreSQL) | 데이터 저장, Cron Jobs |
| 결제 | 토스페이먼츠 | 빌링키 발급, 정기 결제 |
| AI 분석 | Google Gemini API | 사주 분석 (`gemini-2.5-flash`, `gemini-2.5-pro`) |

---

## 3. 제공 페이지

| 페이지 | 경로 | 인증 필요 | 설명 |
|--------|------|-----------|------|
| 홈 (랜딩) | `/` | ❌ | 서비스 소개, 로그인/회원가입 CTA |
| 대시보드 | `/dashboard` | ✅ | 사용자의 분석 목록 |
| 새 분석하기 | `/analysis/new` | ✅ | 사주 정보 입력 폼 |
| 분석 상세보기 | `/analysis/[id]` | ✅ | 분석 결과 마크다운 렌더링 |
| 구독 관리 | `/subscription` | ✅ | 구독 상태 확인, 결제/취소 |

**접근 제어**:
- 홈 페이지: 인증 불필요
- 기타 모든 페이지: 인증 필수 (Clerk 미들웨어로 보호)

---

## 4. 기능 요구사항

### 4.1 사용자 인증 (Clerk)

#### 4.1.1 Clerk 로그인
- Clerk SDK 기본 컴포넌트 사용 (`SignInButton`, `SignUpButton`, `UserButton`)
- Clerk Dashboard에서 로그인 설정
- 로그인/회원가입/로그아웃 기능 제공

#### 4.1.2 Clerk Webhook
- 사용자 생성/업데이트/삭제 이벤트 수신
- Supabase `users` 테이블에 사용자 정보 동기화
- Webhook은 배포 환경에서만 작동 (로컬 테스트 시 ngrok 필요)

#### 4.1.3 **필수 패키지**

- `@clerk/nextjs@latest`, `svix`

#### 4.1.4 주요 구현 사항
- `clerkMiddleware()` 사용 (구버전 `authMiddleware()` 사용 금지)
- 서버/클라이언트 import 경로 구분 필수
  - 서버 컴포넌트: `@clerk/nextjs/server`
  - 클라이언트 컴포넌트: `@clerk/nextjs`
- App Router 전용 (`app/` 디렉토리)
- 상세 구현 가이드: [clerk-auth.md](./external/clerk-auth.md)

---

### 4.2 사주 분석 기능 (Gemini API)

#### 4.2.1 무료 사용자
- **테스트 횟수**: 최초 3회
- **사용 모델**: `gemini-2.5-flash`

#### 4.2.2 Pro 구독 사용자
- **테스트 횟수**: 월 10회 (매 결제일 갱신)
- **사용 모델**: `gemini-2.5-pro`

#### 4.2.3 분석 입력 정보
- 성함
- 생년월일
- 출생시간 (선택)
- 성별

#### 4.2.4 분석 결과
- 천간(天干)과 지지(地支) 계산
- 오행(五行) 분석 (목, 화, 토, 금, 수)
- 대운(大運)과 세운(歲運) 해석
- 성격, 재운, 건강운, 연애운 분석
- 마크다운 형식으로 저장 및 표시

**필수 패키지**: `@google/generative-ai`

---

### 4.3 구독 결제 시스템 (토스페이먼츠)

#### 4.3.1 구독 가입
1. 사용자가 구독 관리 페이지에서 "Pro 구독" 신청
2. 토스페이먼츠 빌링키 발급 화면으로 이동
3. 카드 정보 입력 및 인증
4. 빌링키 발급 성공 시 최초 결제 (9,900원) 즉시 실행
5. Pro 상태 활성화 및 테스트 횟수 10회 지급

#### 4.3.2 구독 상태
- **Active (활성)**: 정상 구독 중
- **Cancellation Pending (취소 예정)**: 다음 결제일까지 Pro 혜택 유지
- **Expired (만료)**: 해지 완료
- **Failed (실패)**: 결제 실패로 자동 해지

#### 4.3.3 구독 취소
- 구독 관리 페이지에서 "구독 취소" 신청 가능
- 다음 결제일까지 Pro 혜택 유지
- 취소 예정 상태에서 "취소 철회" 가능

#### 4.3.4 자동 정기 결제
- Supabase Cron Job으로 매일 02:00 (KST) 실행
- 결제일 도래 구독 건 자동 탐색 및 결제
- **결제 성공 시**: 테스트 횟수 +10, 구독 기간 1개월 연장
- **결제 실패 시**: 즉시 해지, 빌링키 삭제

#### 4.3.5 재구독
- 해지 후 재구독 시 빌링키 재발급 필요

**필수 패키지**: `@tosspayments/tosspayments-sdk`

---

## 5. API 엔드포인트

### 5.1 인증
- `POST /api/webhooks/clerk` - Clerk 웹훅 수신

### 5.2 분석
- `POST /api/analysis` - 새 분석 생성
- `GET /api/analysis` - 사용자 분석 목록 조회
- `GET /api/analysis/[id]` - 분석 상세 조회

### 5.3 구독
- `GET /api/subscription` - 구독 상태 조회
- `POST /api/subscription/billing-key` - 빌링키 발급 후 구독 생성
- `POST /api/subscription/cancel` - 구독 취소 신청
- `POST /api/subscription/reactivate` - 취소 철회
- `POST /api/cron/process-subscriptions` - 정기 결제 처리 (Cron 전용)

---

## 6. 환경 변수

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# Gemini API
GEMINI_API_KEY=AIza...

# Supabase Cron 요청 보안
CRON_REQUEST_SECRET=your-strong-random-secret
```

---

## 7. 통과 조건 체크리스트

### 7.1 필수 연동
- [ ] Clerk SDK 연동 (로그인)
- [ ] Clerk Webhook 구현 (사용자 동기화)
- [ ] 토스페이먼츠 SDK 연동 (빌링키 발급)
- [ ] 토스페이먼츠 API 연동 (정기 결제, 빌링키 삭제)
- [ ] Gemini API 연동 (flash/pro 모델 분기)
- [ ] Supabase 데이터베이스 구성
- [ ] Supabase Cron Jobs 설정

### 7.2 필수 페이지
- [ ] 홈 (랜딩페이지) - 인증 불필요
- [ ] 대시보드 (분석 목록) - 인증 필요
- [ ] 새 분석하기 - 인증 필요
- [ ] 분석 상세보기 - 인증 필요
- [ ] 구독 관리 - 인증 필요

### 7.3 구독 정책
- [ ] 무료 사용자: 최초 3회, `gemini-2.5-flash` 사용
- [ ] Pro 구독자: 월 10회, `gemini-2.5-pro` 사용
- [ ] 구독 취소 시 다음 결제일까지 상태 유지
- [ ] 취소 예정 상태에서 철회 가능
- [ ] 해지 시 빌링키 자동 삭제
- [ ] 재구독 시 빌링키 재발급 필요

### 7.4 자동 결제
- [ ] Supabase Cron으로 매일 02:00 API 호출
- [ ] CRON_REQUEST_SECRET으로 요청 검증
- [ ] 결제일 도래 구독 건 자동 탐색
- [ ] 결제 성공 시 테스트 횟수 +10, 구독 기간 연장
- [ ] 결제 실패 시 즉시 해지 및 빌링키 삭제

---

## 8. 배포 고려사항

### 8.1 Clerk Webhook
- 배포 후 공개 URL로 Clerk Dashboard에서 Webhook 설정
- `user.created`, `user.updated`, `user.deleted` 이벤트 활성화

### 8.2 Supabase Cron
- Supabase SQL Editor에서 Cron Job 생성
- 배포된 Next.js API를 Cron 대상으로 설정

### 8.3 보안
- 서버 전용 키는 클라이언트 노출 금지
- Supabase Cron API 엔드포인트에 CRON_REQUEST_SECRET 를 이용한 인증 필수
- Webhook 서명 검증 필수

---

## 9. 참고 자료

### 9.1 공식 문서
- [Clerk 공식 문서](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [토스페이먼츠 개발자 센터](https://docs.tosspayments.com/)
- [토스페이먼츠 자동결제(빌링) 가이드](https://docs.tosspayments.com/guides/v2/billing.md)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Supabase 문서](https://supabase.com/docs)

### 9.2 구현 힌트
**Clerk**:
- `clerkMiddleware()` 사용 (최신 버전)
- Webhook은 배포 환경에서만 테스트 가능
- `clerk_user_id`를 토스페이먼츠 `customerKey`로 사용

**토스페이먼츠**:
- 빌링키 발급 → 최초 결제 → 정기 결제 순서
- Basic 인증 방식 (시크릿키 + 콜론 Base64 인코딩)
- 테스트 환경에서는 실제 결제 없이 시뮬레이션 가능

**Supabase**:
- Cron 시간대는 UTC 기준 (한국 02:00 = UTC 전날 17:00)
- `net.http_post()` 함수로 외부 API 호출

**Gemini API**:
- 무료: `gemini-2.5-flash`, 유료: `gemini-2.5-pro`
- Rate Limit 확인 필요
