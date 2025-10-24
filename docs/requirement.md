# 요구사항 정의서 (Requirement Document)

## 1. 프로젝트 개요

### 1.1 목적
Clerk, Supabase, 토스페이먼츠를 연동한 구독형 사주 분석 서비스 구현

### 1.2 핵심 가치
- Google 로그인 기반 사용자 인증
- 무료/유료 구독 모델을 통한 차등화된 서비스 제공
- Gemini AI 기반 사주팔자 분석
- 자동 정기 결제 시스템

---

## 2. 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | 풀스택 웹 애플리케이션 |
| 인증 | Clerk | Google OAuth, 세션 관리, Webhook |
| 데이터베이스 | Supabase (PostgreSQL) | 데이터 저장, Cron Jobs |
| 결제 | 토스페이먼츠 | 빌링키 발급, 정기 결제 |
| AI 분석 | Google Gemini API | 사주 분석 (`gemini-2.5-flash`, `gemini-2.5-pro`) |

---

## 3. 기능 요구사항

### 3.1 사용자 인증 (Clerk)

#### 3.1.1 Google 로그인
- Clerk SDK 기본 컴포넌트 사용
- 회원가입, 로그인, 로그아웃 페이지 제공
- Google OAuth 연동

#### 3.1.2 Clerk Webhook
- 사용자 생성/업데이트/삭제 이벤트 수신
- Supabase `users` 테이블에 사용자 정보 동기화
- Webhook은 배포 환경에서만 작동

---

### 3.2 페이지 구성 및 접근 제어

| 페이지 | 경로 | 인증 필요 | 설명 |
|--------|------|-----------|------|
| 홈 (랜딩) | `/` | ❌ | 서비스 소개, 로그인/회원가입 CTA |
| 대시보드 | `/dashboard` | ✅ | 사용자의 분석 목록 |
| 새 분석하기 | `/analysis/new` | ✅ | 사주 정보 입력 폼 |
| 분석 상세보기 | `/analysis/[id]` | ✅ | 분석 결과 마크다운 렌더링 |
| 구독 관리 | `/subscription` | ✅ | 구독 상태 확인, 결제/취소 |

**접근 제어 규칙:**
- 홈 페이지 외 모든 페이지는 인증 필수
- Clerk 미들웨어/컴포넌트로 보호

---

### 3.3 사주 분석 기능 (Gemini API)

#### 3.3.1 무료 사용자
- **테스트 횟수:** 최초 3회
- **사용 모델:** `gemini-2.5-flash`
- 회원가입 시 자동 부여

#### 3.3.2 Pro 구독 사용자
- **테스트 횟수:** 월 10회 (매 결제일 갱신)
- **사용 모델:** `gemini-2.5-pro`
- 구독 활성화 시 즉시 적용

#### 3.3.3 분석 프로세스
1. 사용자 입력: 성함, 생년월일, 출생시간, 성별
2. 잔여 테스트 횟수 확인 (Supabase)
3. Gemini API 호출 (사용자 등급에 따른 모델 선택)
4. 분석 결과 Supabase 저장 및 테스트 횟수 차감
5. 마크다운 형식 결과 반환

#### 3.3.4 프롬프트 구조
```typescript
// 예시 시스템 프롬프트
당신은 20년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: {name}
- 생년월일: {birthDate}
- 출생시간: {birthTime || '미상'}
- 성별: {gender === 'male' ? '남성' : '여성'}

**분석 요구사항**:
- 천간(天干)과 지지(地支) 계산
- 오행(五行) 분석 (목, 화, 토, 금, 수)
- 대운(大運)과 세운(歲運) 해석
- 전반적인 성격, 재운, 건강운, 연애운 분석

**출력 형식**: 마크다운

**금지 사항**:
- 의료·법률 조언
- 확정적 미래 예측
- 부정적·공격적 표현
```

---

### 3.4 구독 결제 시스템 (토스페이먼츠)

#### 3.4.1 구독 가입 플로우
1. 사용자가 구독 관리 페이지에서 "Pro 구독" 버튼 클릭
2. 토스페이먼츠 SDK로 빌링키 발급 위젯 표시
3. 사용자 결제 수단 입력 및 인증
4. 빌링키 발급 성공 시:
   - Supabase `subscriptions` 테이블에 구독 정보 저장
   - `billing_key`, `customer_key`, `next_payment_date` (1개월 후) 저장
   - 구독 상태: `active`
5. 최초 결제 즉시 실행
6. 성공 시 사용자 `test_count` +10, Pro 상태 활성화

#### 3.4.2 구독 상태 관리

| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | `active` | 정상 구독 중, 다음 결제일에 자동 결제 |
| 취소 예정 | `cancellation_pending` | 사용자가 취소했으나 다음 결제일까지 유효 |
| 만료 | `expired` | 결제일 도래 후 해지 완료 |
| 실패 | `failed` | 결제 실패로 인한 자동 해지 |

#### 3.4.3 구독 취소 정책
1. **취소 신청:**
   - 구독 관리 페이지에서 "구독 취소" 버튼 클릭
   - 상태가 `active` → `cancellation_pending`으로 변경
   - 다음 결제일까지 Pro 혜택 유지

2. **취소 철회:**
   - `cancellation_pending` 상태에서 "취소 철회" 가능
   - 상태가 `cancellation_pending` → `active`로 변경
   - 다음 결제일에 정상 결제 진행

3. **해지 완료:**
   - 다음 결제일 도래 시 자동으로 `expired` 상태로 변경
   - 토스페이먼츠 API를 통해 빌링키 삭제
   - 사용자 Pro 상태 회수

---

### 3.5 자동 정기 결제 시스템 (Supabase Cron)

#### 3.5.1 Cron Job 설정
```sql
-- Supabase SQL Editor에서 실행
SELECT cron.schedule(
  'daily-subscription-billing',
  '0 2 * * *',  -- 매일 02:00 KST
  $$
  SELECT net.http_post(
    url := 'https://yourdomain.com/api/cron/process-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

#### 3.5.2 정기 결제 API 플로우
**엔드포인트:** `POST /api/cron/process-subscriptions`

**1. 요청 검증**
- `Authorization` 헤더에서 Cron Secret 확인
- 유효하지 않으면 `401 Unauthorized` 반환

**2. 결제 대상 구독 조회**
```sql
SELECT * FROM subscriptions
WHERE next_payment_date = CURRENT_DATE
  AND status IN ('active', 'cancellation_pending')
```

**3. 각 구독 건 처리**

**Case A: 취소 예정 건 (`cancellation_pending`)**
```
1. 구독 상태를 'expired'로 변경
2. 토스페이먼츠 API 호출: DELETE /billing-key/{billing_key}
3. users 테이블에서 is_pro = false 설정
4. (선택) test_count 초기화하지 않음 (남은 횟수는 유지)
```

**Case B: 활성 구독 건 (`active`)**
```
1. 토스페이먼츠 정기 결제 API 호출:
   POST /v1/billing/{billing_key}
   {
     "customerKey": "...",
     "amount": 9900,
     "orderName": "사주 분석 Pro 구독"
   }

2-A. 결제 성공:
   - users.test_count += 10
   - subscriptions.next_payment_date += 1 month
   - subscriptions.last_payment_date = today
   - payment_history 테이블에 성공 기록

2-B. 결제 실패:
   - subscriptions.status = 'failed'
   - 토스페이먼츠 API 호출: DELETE /billing-key/{billing_key}
   - users.is_pro = false
   - payment_history 테이블에 실패 기록
```

#### 3.5.3 재구독
- 해지(`expired`, `failed`) 후 재구독 시 빌링키 재발급 필수
- 토스페이먼츠 SDK로 새로운 빌링키 발급 프로세스 진행

---

## 4. 데이터베이스 스키마 (Supabase)

### 4.1 users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  profile_image_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  test_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 subscriptions 테이블
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  billing_key TEXT NOT NULL,
  customer_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancellation_pending', 'expired', 'failed')),
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 analyses 테이블
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  model_used TEXT NOT NULL,
  result_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 payment_history 테이블
```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  payment_key TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API 엔드포인트 설계

### 5.1 인증 관련
- `POST /api/webhooks/clerk` - Clerk 웹훅 수신

### 5.2 분석 관련
- `POST /api/analysis` - 새 분석 생성
- `GET /api/analysis` - 사용자 분석 목록 조회
- `GET /api/analysis/[id]` - 분석 상세 조회

### 5.3 구독 관련
- `GET /api/subscription` - 현재 구독 상태 조회
- `POST /api/subscription/billing-key` - 빌링키 발급 후 구독 생성
- `POST /api/subscription/cancel` - 구독 취소 신청
- `POST /api/subscription/reactivate` - 취소 철회
- `POST /api/cron/process-subscriptions` - 정기 결제 처리 (Cron 전용)

---

## 6. 환경 변수

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Gemini API
GEMINI_API_KEY=

# Cron 보안
CRON_SECRET=
```

---

## 7. 통과 조건 체크리스트

### 7.1 필수 연동
- [ ] Clerk SDK 연동 (Google 로그인)
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
- [ ] Cron Secret으로 요청 검증
- [ ] 결제일 도래 구독 건 자동 탐색
- [ ] 결제 성공 시 테스트 횟수 +10, 구독 기간 연장
- [ ] 결제 실패 시 즉시 해지 및 빌링키 삭제

---

## 8. 배포 고려사항

### 8.1 Clerk Webhook
- Vercel/AWS 등 배포 후 공개 URL 확보
- Clerk Dashboard에서 Webhook Endpoint 등록
- `user.created`, `user.updated`, `user.deleted` 이벤트 활성화

### 8.2 Supabase Cron
- Supabase SQL Editor에서 Cron Job 생성
- Next.js API의 배포 URL을 Cron 대상으로 설정

### 8.3 보안
- 환경 변수 노출 방지 (서버 전용 키는 클라이언트로 전달 금지)
- Cron API 엔드포인트에 강력한 Secret 인증 적용
- 토스페이먼츠 Webhook 검증 (선택사항)

---

## 9. 평가 기준

### 9.1 필수 항목
1. **SDK 연동**: Clerk, 토스페이먼츠, Gemini API 오류 없이 작동
2. **요구사항 문서**: 본 문서의 명확성 및 완성도
3. **(가산점) 프롬프트/Agent 저장**: 구현 과정에서 사용한 프롬프트 문서화

### 9.2 비평가 항목
- 디자인 품질 (미리보기와 동일할 필요 없음)
- 추가 기능 구현 (명시되지 않은 기능)

---

## 10. 참고 자료

### 10.1 공식 문서
- [Clerk 공식 문서](https://clerk.com/docs)
- [토스페이먼츠 개발자 센터](https://docs.tosspayments.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Supabase 문서](https://supabase.com/docs)

### 10.2 구현 힌트
- Clerk Webhook은 배포 환경에서만 테스트 가능
- 빌링키는 고객 식별자로 `clerk_user_id` 사용 권장
- Supabase Cron 실행 로그는 Supabase Dashboard > Database > Cron Jobs에서 확인
- Gemini API 호출 시 안전 설정(Safety Settings) 적절히 조정
