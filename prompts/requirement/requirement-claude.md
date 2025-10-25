# 구독제 사주분석 서비스 - 요구사항 명세서

## 1. 프로젝트 개요

### 1.1 서비스 설명
Gemini API 기반 사주분석을 제공하는 구독형 웹 서비스

### 1.2 기술 스택
- **Frontend & Backend**: Next.js (App Router)
- **인증**: Clerk
- **데이터베이스**: Supabase (PostgreSQL)
- **결제**: 토스페이먼츠 (정기결제/빌링키)
- **AI**: Google Gemini API (gemini-2.5-flash, gemini-2.5-pro)
- **배포**: Vercel

---

## 2. 핵심 기능 요구사항

### 2.1 인증 (Authentication)
- **방식**: Clerk SDK를 통한 로그인
- **인증 페이지**: Clerk에서 기본 제공하는 UI 사용
- **인증 상태 관리**: Clerk의 세션 관리 활용
- **보호된 라우트**: 홈 페이지를 제외한 모든 페이지는 인증 필수

### 2.2 사주분석 (Core Feature)
- **입력 정보**:
  - 성함
  - 생년월일
  - 출생시간 (선택)
  - 성별
  
- **분석 내용**:
  - 천간(天干)과 지지(地支) 계산
  - 오행(五行) 분석 (목, 화, 토, 금, 수)
  - 대운(大運)과 세운(歲運) 해석
  - 전반적인 성격, 재운, 건강운, 연애운 분석
  
- **출력 형식**: Markdown
  
- **금지 사항**:
  - 의료·법률 조언
  - 확정적 미래 예측
  - 부정적·공격적 표현

### 2.3 구독 결제 (Subscription)
- **결제 수단**: 토스페이먼츠 정기결제 (빌링키)
- **정기결제 실행**: Supabase cron (매일 02:00)을 통한 자동 결제
- **결제 플로우**:
  1. Supabase cron이 매일 02:00에 Next.js API 호출
  2. Next.js API에서 호출 검증
  3. 오늘이 결제일인 구독건 탐색 후 결제 API 호출

---

## 3. 구독 정책

### 3.1 요금제

| 항목 | 무료 (Free) | Pro |
|------|-------------|-----|
| 월 이용 횟수 | 최초 3회 (평생) | 월 10회 |
| AI 모델 | gemini-2.5-flash | gemini-2.5-pro |
| 가격 | 무료 | 월 정기결제 |

### 3.2 구독 관리 규칙
1. **무료 사용자**: 최초 가입 후 3회까지만 사주분석 가능
2. **Pro 구독자**: 매월 10회 사주분석 가능
3. **구독 취소**:
   - 취소 시 다음 결제일까지 Pro 상태 유지
   - 다음 결제일 전까지 취소 철회 가능
4. **구독 해지**:
   - 해지 즉시 빌링키 삭제
   - 재구독 시 토스페이먼츠 SDK를 통한 빌링키 재발급 필요

---

## 4. 페이지 구조

### 4.1 페이지 목록

| 경로 | 페이지명 | 인증 필요 | 설명 |
|------|----------|-----------|------|
| `/` | 홈 (랜딩) | ❌ | 서비스 소개 및 시작하기 |
| `/dashboard` | 대시보드 | ✅ | 사용자의 분석 목록 표시 |
| `/analysis/new` | 새 분석하기 | ✅ | 사주 정보 입력 폼 |
| `/analysis/[id]` | 분석 상세보기 | ✅ | 특정 분석 결과 조회 |
| `/subscription` | 구독 관리 | ✅ | 구독 상태 확인 및 변경 |

### 4.2 페이지별 요구사항

#### 4.2.1 홈 (랜딩페이지)
- 서비스 소개
- 시작하기 버튼 (로그인으로 이동)
- 요금제 안내

#### 4.2.2 대시보드
- 사용자의 분석 이력 목록
- 현재 구독 상태 표시 (Free/Pro)
- 남은 분석 횟수 표시
- 새 분석하기 버튼

#### 4.2.3 새 분석하기
- 입력 폼:
  - 성함 (필수)
  - 생년월일 (필수)
  - 출생시간 (선택)
  - 성별 (필수)
- 분석 가능 여부 검증 (횟수 제한)
- Gemini API 호출 및 결과 저장
- 분석 완료 후 상세보기로 이동

#### 4.2.4 분석 상세보기
- 분석 결과를 Markdown으로 렌더링
- 분석 입력 정보 표시
- 분석 일시 표시

#### 4.2.5 구독 관리
- 현재 구독 상태 표시
- Pro 구독하기 (빌링키 발급)
- Pro 구독 취소/취소 철회
- Pro 구독 해지 (빌링키 삭제)
- 결제 이력

---

## 5. 데이터베이스 스키마

### 5.1 Users 테이블
```sql
users
- id (PK, UUID)
- clerk_user_id (Unique, String) -- Clerk의 사용자 ID
- email (String)
- name (String)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### 5.2 Subscriptions 테이블
```sql
subscriptions
- id (PK, UUID)
- user_id (FK -> users.id)
- plan (String) -- 'free' | 'pro'
- status (String) -- 'active' | 'cancelled' | 'expired'
- billing_key (String, Nullable) -- 토스페이먼츠 빌링키
- current_period_start (Date)
- current_period_end (Date)
- next_billing_date (Date, Nullable)
- cancelled_at (Timestamp, Nullable)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### 5.3 Analyses 테이블
```sql
analyses
- id (PK, UUID)
- user_id (FK -> users.id)
- name (String) -- 분석 대상 이름
- birth_date (Date)
- birth_time (String, Nullable)
- gender (String) -- 'male' | 'female'
- result (Text) -- Markdown 형식의 분석 결과
- model_used (String) -- 'gemini-2.5-flash' | 'gemini-2.5-pro'
- created_at (Timestamp)
```

### 5.4 Usage 테이블 (월별 사용량 추적)
```sql
usage
- id (PK, UUID)
- user_id (FK -> users.id)
- month (String) -- 'YYYY-MM' 형식
- count (Integer) -- 해당 월 사용 횟수
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

## 6. API 엔드포인트

### 6.1 인증 관련
- Clerk SDK에서 자동 처리

### 6.2 분석 관련
- `POST /api/analyses` - 새 분석 생성
- `GET /api/analyses` - 분석 목록 조회
- `GET /api/analyses/[id]` - 특정 분석 조회
- `GET /api/analyses/usage` - 사용량 조회

### 6.3 구독 관련
- `POST /api/subscription/create` - Pro 구독 시작 (빌링키 발급)
- `POST /api/subscription/cancel` - Pro 구독 취소
- `POST /api/subscription/reactivate` - 구독 취소 철회
- `POST /api/subscription/terminate` - 구독 해지 (빌링키 삭제)
- `GET /api/subscription/status` - 구독 상태 조회

### 6.4 결제 관련
- `POST /api/payments/charge` - 정기결제 실행 (Supabase cron에서 호출)
- `POST /api/webhooks/clerk` - Clerk 웹훅 처리 (사용자 생성/삭제)
- `POST /api/webhooks/toss` - 토스페이먼츠 웹훅 처리 (결제 결과)

---

## 7. Webhook 설정

### 7.1 Clerk Webhook
- **이벤트**: `user.created`, `user.deleted`
- **용도**: 사용자 생성 시 DB에 기록, 삭제 시 관련 데이터 처리
- **주의**: 서비스 배포 후에만 작동

### 7.2 토스페이먼츠 Webhook
- **이벤트**: 결제 승인/실패
- **용도**: 결제 결과에 따른 구독 상태 업데이트

---

## 8. Supabase Cron 설정

### 8.1 정기결제 Cron Job
```sql
-- 매일 02:00(KST)에 실행
SELECT cron.schedule(
  'daily-billing',
  '0 17 * * *',  -- UTC 17:00 = KST 02:00
  $$
  SELECT net.http_post(
    url := 'https://your-domain.vercel.app/api/payments/charge',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## 9. 환경변수

### 9.1 필수 환경변수
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Gemini API
GEMINI_API_KEY=

# Webhook Security
WEBHOOK_SECRET_KEY=  # API 호출 검증용
```

---

## 10. 보안 요구사항

1. **API 보호**: 
   - 인증이 필요한 API는 Clerk 세션 검증 필수
   - Cron job 호출은 secret key로 검증

2. **빌링키 보호**:
   - 빌링키는 암호화하여 저장
   - 클라이언트에 노출 금지

3. **웹훅 검증**:
   - Clerk 웹훅: 서명 검증
   - 토스페이먼츠 웹훅: 서명 검증

4. **사용량 제한**:
   - 무료 사용자: 3회 초과 시 분석 불가
   - Pro 사용자: 월 10회 초과 시 분석 불가

---

## 11. 에러 처리

### 11.1 주요 에러 케이스
1. **인증 실패**: 로그인 페이지로 리다이렉트
2. **사용량 초과**: 안내 메시지 + 구독 페이지로 이동
3. **결제 실패**: 사용자에게 알림 + 재시도 옵션
4. **API 호출 실패**: 재시도 로직 + 에러 로그 저장

---

## 12. 테스트 시나리오

### 12.1 인증 플로우
1. 비로그인 상태에서 보호된 페이지 접근 → 로그인 페이지로 리다이렉트
2. Clerk 로그인 → 성공 시 대시보드로 이동
3. 로그아웃 → 홈으로 리다이렉트

### 12.2 분석 플로우
1. 무료 사용자 3회 분석 → 성공
2. 무료 사용자 4회 분석 시도 → 거부 + 구독 안내
3. Pro 사용자 10회 분석 → 성공
4. Pro 사용자 11회 분석 시도 → 거부 + 다음 달 안내

### 12.3 구독 플로우
1. Pro 구독 시작 → 빌링키 발급 + 즉시 결제
2. Pro 구독 취소 → 다음 결제일까지 유지
3. 구독 취소 철회 → 정상 구독 상태로 복귀
4. 구독 해지 → 빌링키 삭제 + 즉시 무료 전환

### 12.4 정기결제 플로우
1. Supabase cron이 API 호출
2. API에서 오늘 결제일인 구독 탐색
3. 각 구독에 대해 빌링키로 결제 실행
4. 결제 성공/실패에 따라 상태 업데이트

---

## 13. 배포 요구사항

1. **Vercel 배포**: main 브랜치 푸시 시 자동 배포
2. **환경변수 설정**: Vercel 대시보드에서 설정
3. **도메인 연결**: Vercel 제공 도메인 또는 커스텀 도메인
4. **Webhook URL 등록**:
   - Clerk: `https://your-domain.vercel.app/api/webhooks/clerk`
   - 토스페이먼츠: `https://your-domain.vercel.app/api/webhooks/toss`
5. **Supabase Cron URL 업데이트**: 배포된 도메인으로 변경

---

## 14. 제외 사항

다음 사항은 평가 대상이 아니며 자유롭게 구현 가능:
- 미리보기와 동일한 디자인 및 문구
- 추가적인 UI/UX 개선
- 통과 조건에 명시되지 않은 기능

---

## 15. 참고사항

### 15.1 Gemini 프롬프트 예시
```typescript
const generateSajuPrompt = (input: TestInput): string => {
  return `당신은 20년 경력의 전문 사주팔자 상담사입니다.

**입력 정보**:
- 성함: ${input.name}
- 생년월일: ${input.birthDate}
- 출생시간: ${input.birthTime || '미상'}
- 성별: ${input.gender === 'male' ? '남성' : '여성'}

**분석 요구사항**:
1️⃣ 천간(天干)과 지지(地支) 계산
2️⃣ 오행(五行) 분석 (목, 화, 토, 금, 수)
3️⃣ 대운(大運)과 세운(歲運) 해석
4️⃣ 전반적인 성격, 재운, 건강운, 연애운 분석

**출력 형식**: 마크다운

**금지 사항**:
- 의료·법률 조언
- 확정적 미래 예측
- 부정적·공격적 표현`;
};
```

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-10-25