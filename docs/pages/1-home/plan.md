# 홈 (랜딩 페이지) 구현 계획

## 문서 정보

- **페이지명**: 홈 (랜딩 페이지)
- **라우트**: `/`
- **작성일**: 2025-10-27
- **관련 유스케이스**: UC-005 랜딩 페이지

---

## 1. 페이지 개요 및 목적

### 1.1 페이지 목적

신규 방문자에게 Vibe Fortune 서비스의 핵심 가치를 전달하고, 사용자 유입 및 회원가입을 유도하는 랜딩 페이지입니다.

### 1.2 주요 기능

- 서비스 소개 및 핵심 가치 제안
- Hero, Features, Pricing, FAQ 섹션 제공
- 로그인 여부에 따른 동적 CTA 버튼 표시
- 앵커 네비게이션을 통한 섹션 간 이동
- 반응형 디자인 지원 (모바일/태블릿/데스크톱)

### 1.3 핵심 가치 제안

- AI 기반 전문적인 사주팔자 분석
- Google 계정으로 간편한 시작
- 과거 분석 이력 관리
- 무료 서비스 제공

---

## 2. 라우트 및 접근 권한

### 2.1 라우트 정보

- **경로**: `/`
- **파일 위치**: `src/app/page.tsx`
- **레이아웃**: `src/app/layout.tsx` (루트 레이아웃)

### 2.2 접근 권한

- **권한**: 누구나 접근 가능 (Public)
- **인증 요구사항**: 없음
- **미들웨어 처리**: 인증 체크 없이 통과

### 2.3 네비게이션 플로우

```
[홈 페이지]
  → (비로그인) "시작하기" 클릭 → Clerk 로그인 페이지 → 대시보드
  → (로그인) "이용하기" 클릭 → 대시보드
  → 앵커 메뉴 클릭 → 페이지 내 섹션 스크롤
```

---

## 3. 사용할 공통 모듈 목록

### 3.1 인증 관련

- **Clerk SDK**
  - `@clerk/nextjs` - SignedIn, SignedOut, SignInButton 컴포넌트
  - Clerk 세션 상태 확인
  - 로그인/로그아웃 처리

### 3.2 UI 컴포넌트

- **레이아웃 컴포넌트**
  - `src/components/layout/home-header.tsx` - 홈 페이지 전용 헤더

- **shadcn/ui 컴포넌트**
  - `Button` - CTA 버튼, 네비게이션 버튼
  - `Card` - Features 섹션 카드
  - `Accordion` - FAQ 섹션

### 3.3 유틸리티

- `src/lib/utils.ts` - cn() 유틸리티 (클래스명 병합)
- Next.js Link, Image 컴포넌트

### 3.4 아이콘

- `lucide-react` - 아이콘 컴포넌트
  - Sparkles (AI 분석)
  - UserCircle (Google 로그인)
  - History (이력 관리)
  - FileText (마크다운 렌더링)

---

## 4. 페이지 컴포넌트 구조

### 4.1 컴포넌트 계층 구조

```
HomePage (src/app/page.tsx)
├── HomeHeader (src/components/layout/home-header.tsx)
│   ├── Logo
│   ├── Navigation Menu (앵커 링크)
│   └── Auth Actions
│       ├── SignedOut → SignInButton
│       └── SignedIn → "이용하기" Link + UserButton
│
├── HeroSection
│   ├── Main Headline
│   ├── Sub Headline
│   └── CTA Button
│
├── FeaturesSection
│   ├── Section Title
│   └── Feature Cards (4개)
│       ├── AI 기반 전문 분석
│       ├── 간편한 Google 로그인
│       ├── 분석 이력 관리
│       └── 마크다운 렌더링
│
├── PricingSection
│   ├── Section Title
│   └── Pricing Card
│       ├── 무료 이용 강조
│       └── 혜택 목록
│
└── FAQSection
    ├── Section Title
    └── FAQ Accordion
        ├── Q1: 서비스 이용 방법
        ├── Q2: 비용 안내
        ├── Q3: 개인정보 보호
        ├── Q4: 분석 정확도
        ├── Q5: 출생시간을 모르는 경우
        └── Q6: 분석 결과 저장 기간
```

### 4.2 컴포넌트 파일 구조

```
src/app/page.tsx                              # 메인 페이지 (Client Component)
src/components/layout/home-header.tsx         # 홈 헤더 (이미 구현됨)
src/components/home/hero-section.tsx          # Hero 섹션
src/components/home/features-section.tsx      # Features 섹션
src/components/home/feature-card.tsx          # Feature 카드
src/components/home/pricing-section.tsx       # Pricing 섹션
src/components/home/faq-section.tsx           # FAQ 섹션
```

---

## 5. 구현할 기능 목록

### 5.1 헤더 기능

- [x] 로고 표시 및 홈으로 이동
- [x] 앵커 네비게이션 메뉴 (홈, 서비스, 가격, FAQ)
- [x] 로그인 상태에 따른 CTA 버튼 변경
  - 비로그인: "시작하기" 버튼 (Clerk SignInButton)
  - 로그인: "이용하기" 버튼 (대시보드 링크) + UserButton

**참고**: `home-header.tsx`는 이미 구현되어 있으므로 재사용

### 5.2 Hero 섹션

- [ ] 메인 헤드라인 표시
  - 텍스트: "AI가 분석하는 나만의 사주팔자"
- [ ] 서브 헤드라인 표시
  - 텍스트: "Google 계정으로 1분 안에 시작하세요"
- [ ] CTA 버튼
  - 로그인 여부에 따라 동적 처리
  - 클릭 시 대시보드로 이동
- [ ] 배경 그라디언트 또는 이미지 적용

### 5.3 Features 섹션

- [ ] 섹션 제목: "주요 기능"
- [ ] 4개의 Feature 카드 표시
  - **AI 기반 전문 분석**
    - 아이콘: Sparkles
    - 설명: Gemini API를 활용한 20년 경력 사주상담사 수준의 분석
  - **간편한 Google 로그인**
    - 아이콘: UserCircle
    - 설명: 클릭 한 번으로 시작, 복잡한 회원가입 절차 없음
  - **분석 이력 관리**
    - 아이콘: History
    - 설명: 과거 분석 결과를 언제든 다시 확인 가능
  - **마크다운 렌더링**
    - 아이콘: FileText
    - 설명: 보기 쉽고 구조화된 분석 결과 제공

- [ ] 반응형 그리드 레이아웃
  - 모바일: 1열
  - 태블릿: 2열
  - 데스크톱: 4열

### 5.4 Pricing 섹션

- [ ] 섹션 제목: "요금 안내"
- [ ] 무료 이용 강조
  - 제목: "완전 무료"
  - 설명: "구독 없이 누구나 무료로 이용 가능"
- [ ] 혜택 목록
  - 무제한 사주분석
  - 이력 관리
  - AI 기반 상세 분석
  - 광고 없음

### 5.5 FAQ 섹션

- [ ] 섹션 제목: "자주 묻는 질문"
- [ ] Accordion 형식의 Q&A (6개)
  - **Q1: 어떻게 사용하나요?**
    - A: Google 계정으로 로그인 후 생년월일과 출생시간을 입력하면 AI가 자동으로 사주를 분석해드립니다.

  - **Q2: 비용이 발생하나요?**
    - A: 아니요, Vibe Fortune은 완전 무료 서비스입니다. 구독이나 결제 없이 모든 기능을 이용하실 수 있습니다.

  - **Q3: 개인정보는 안전한가요?**
    - A: 네, 모든 데이터는 암호화되어 안전하게 저장되며, Google 인증을 통해 보안이 강화되어 있습니다.

  - **Q4: 분석 결과는 얼마나 정확한가요?**
    - A: Google Gemini API를 활용하여 20년 경력의 전문 사주상담사 수준의 분석을 제공합니다.

  - **Q5: 출생시간을 모르는 경우에도 가능한가요?**
    - A: 네, 출생시간을 모르시는 경우 "출생시간 모름"을 선택하시면 됩니다. 다만 더 정확한 분석을 위해서는 출생시간 입력을 권장합니다.

  - **Q6: 분석 결과는 얼마나 보관되나요?**
    - A: 분석 결과는 영구적으로 저장되며, 언제든지 대시보드에서 다시 확인하실 수 있습니다.

### 5.6 앵커 네비게이션

- [ ] 각 섹션에 ID 부여
  - `#hero`
  - `#features`
  - `#pricing`
  - `#faq`
- [ ] 헤더 메뉴 클릭 시 해당 섹션으로 스크롤
- [ ] 부드러운 스크롤 애니메이션 적용

### 5.7 반응형 디자인

- [ ] 모바일 (320px ~ 767px)
  - 햄버거 메뉴 (선택사항)
  - 세로 스크롤 중심
  - 1열 레이아웃

- [ ] 태블릿 (768px ~ 1023px)
  - 2열 레이아웃
  - 헤더 메뉴 유지

- [ ] 데스크톱 (1024px 이상)
  - 풀 레이아웃
  - 고정 헤더 (스크롤 시)

---

## 6. 상태 관리

### 6.1 클라이언트 상태

이 페이지는 대부분 정적 콘텐츠이므로 복잡한 상태 관리가 필요하지 않습니다.

**필요한 로컬 상태**:
- Clerk 세션 상태 (자동 관리)
- 현재 스크롤 위치 (선택사항, 헤더 스타일 변경용)
- FAQ Accordion 열림/닫힘 상태 (shadcn/ui Accordion이 자동 관리)

**상태 관리 라이브러리**: 불필요

### 6.2 인증 상태

- Clerk SDK가 자동으로 세션 상태 관리
- `SignedIn`, `SignedOut` 컴포넌트로 조건부 렌더링
- 추가 상태 관리 불필요

---

## 7. API 호출

### 7.1 필요한 API

**없음** - 이 페이지는 순수 프론트엔드 페이지로, 백엔드 API 호출이 필요하지 않습니다.

### 7.2 인증 확인

- Clerk SDK가 클라이언트 측에서 자동으로 세션 확인
- 서버 측 인증 확인 불필요 (공개 페이지)

---

## 8. 파일 구조 및 경로

### 8.1 신규 생성 파일

```
src/app/page.tsx                              # 메인 홈 페이지 (수정)
src/components/home/hero-section.tsx          # Hero 섹션
src/components/home/features-section.tsx      # Features 섹션
src/components/home/feature-card.tsx          # Feature 카드
src/components/home/pricing-section.tsx       # Pricing 섹션
src/components/home/faq-section.tsx           # FAQ 섹션
```

### 8.2 재사용 파일

```
src/components/layout/home-header.tsx         # 이미 구현됨 (수정 불필요)
src/components/ui/button.tsx                   # shadcn/ui Button
src/components/ui/card.tsx                     # shadcn/ui Card
src/components/ui/accordion.tsx                # shadcn/ui Accordion
```

### 8.3 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (기존)
│   └── page.tsx                       # 홈 페이지 (수정)
│
├── components/
│   ├── layout/
│   │   └── home-header.tsx           # 홈 헤더 (기존)
│   │
│   ├── home/                          # 홈 페이지 전용 컴포넌트 (신규)
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── feature-card.tsx
│   │   ├── pricing-section.tsx
│   │   └── faq-section.tsx
│   │
│   └── ui/                            # shadcn/ui 컴포넌트 (기존)
│       ├── button.tsx
│       ├── card.tsx
│       └── accordion.tsx
│
└── lib/
    └── utils.ts                       # 유틸리티 (기존)
```

---

## 9. 구현 단계

### Phase 1: 기본 구조 설정 (30분)

1. **컴포넌트 디렉토리 생성**
   ```bash
   mkdir -p src/components/home
   ```

2. **기본 섹션 컴포넌트 생성**
   - `hero-section.tsx` 생성 및 기본 구조
   - `features-section.tsx` 생성 및 기본 구조
   - `pricing-section.tsx` 생성 및 기본 구조
   - `faq-section.tsx` 생성 및 기본 구조

3. **메인 페이지 리팩토링**
   - `src/app/page.tsx` 수정
   - 기존 SuperNext 템플릿 코드 제거
   - 새 섹션 컴포넌트 import 및 배치

### Phase 2: Hero 섹션 구현 (20분)

1. **Hero 섹션 레이아웃 작성**
   - 중앙 정렬 컨테이너
   - 그라디언트 배경
   - 반응형 여백 및 패딩

2. **헤드라인 구현**
   - 메인 헤드라인 텍스트
   - 서브 헤드라인 텍스트
   - 타이포그래피 스타일링

3. **CTA 버튼 구현**
   - SignedOut 상태: SignInButton 사용
   - SignedIn 상태: 대시보드 Link 사용
   - 버튼 스타일링 (큰 크기, 눈에 띄는 색상)

### Phase 3: Features 섹션 구현 (30분)

1. **Feature 카드 컴포넌트 작성**
   - Props 타입 정의 (icon, title, description)
   - Card UI 컴포넌트 사용
   - 아이콘 및 텍스트 레이아웃

2. **Features 섹션 작성**
   - 섹션 제목
   - 4개 Feature 카드 배치
   - 반응형 그리드 레이아웃

3. **콘텐츠 작성**
   - 각 Feature별 아이콘, 제목, 설명 입력

### Phase 4: Pricing 섹션 구현 (15분)

1. **Pricing 카드 레이아웃**
   - 중앙 배치
   - 무료 강조 스타일

2. **혜택 목록 작성**
   - 체크 아이콘과 함께 목록 표시
   - 4가지 혜택 나열

### Phase 5: FAQ 섹션 구현 (25분)

1. **FAQ 데이터 준비**
   - 6개 질문과 답변 작성
   - 데이터 배열 구조화

2. **Accordion 컴포넌트 통합**
   - shadcn/ui Accordion 사용
   - FAQ 데이터 매핑

3. **스타일링**
   - Accordion 아이템 스타일
   - 열림/닫힘 애니메이션

### Phase 6: 앵커 네비게이션 구현 (15분)

1. **섹션 ID 부여**
   - 각 섹션에 고유 ID 추가

2. **헤더 메뉴 링크 연결**
   - `home-header.tsx` 확인 (이미 구현되어 있음)
   - 필요시 앵커 링크 추가

3. **스크롤 애니메이션**
   - CSS `scroll-behavior: smooth` 적용
   - 또는 JavaScript `scrollIntoView({ behavior: 'smooth' })` 사용

### Phase 7: 반응형 디자인 적용 (20분)

1. **Tailwind 브레이크포인트 적용**
   - 모바일: 기본 스타일
   - 태블릿: `md:` 접두사
   - 데스크톱: `lg:` 접두사

2. **그리드 레이아웃 조정**
   - Features 섹션: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

3. **여백 및 패딩 조정**
   - 각 섹션별 반응형 여백

### Phase 8: 스타일링 및 최종 점검 (30분)

1. **전체 페이지 스타일링**
   - 색상 테마 통일
   - 일관된 타이포그래피
   - 간격 및 정렬

2. **접근성 개선**
   - ARIA 라벨 추가
   - 키보드 네비게이션 테스트
   - 스크린 리더 호환성 확인

3. **성능 최적화**
   - 이미지 최적화 (필요 시)
   - 불필요한 렌더링 방지

4. **최종 테스트**
   - 로그인/로그아웃 플로우 테스트
   - 모든 섹션 네비게이션 테스트
   - 다양한 화면 크기 테스트

---

## 10. 주의사항

### 10.1 현재 코드베이스 호환성

#### 기존 홈 페이지 교체
- **현재 상태**: `src/app/page.tsx`는 SuperNext 템플릿 소개 페이지
- **처리 방법**: 전체 내용을 Vibe Fortune 랜딩 페이지로 교체
- **백업**: 필요 시 기존 코드를 주석 처리하거나 별도 파일로 백업

#### 인증 방식
- **현재**: Supabase Auth 사용 중
- **변경 예정**: Clerk로 전환
- **주의**: 현재는 Supabase Auth로 구현하되, 향후 Clerk 마이그레이션 시 헤더 컴포넌트만 수정하면 되도록 구조화

#### 레이아웃 재사용
- **home-header.tsx**: 이미 구현되어 있으므로 재사용
- **루트 레이아웃**: `src/app/layout.tsx`는 유지하되, 필요 시 메타데이터 수정

### 10.2 Clerk 통합 (향후 적용)

현재는 Supabase Auth를 사용하고 있으나, PRD에 명시된 대로 Clerk로 전환 예정입니다.

**현재 구현 (Supabase Auth)**:
```tsx
// src/components/layout/home-header.tsx (현재)
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const { user, isAuthenticated } = useCurrentUser();
```

**향후 구현 (Clerk)**:
```tsx
// src/components/layout/home-header.tsx (Clerk 전환 후)
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

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
```

**마이그레이션 전략**:
1. 현재는 기존 Supabase Auth를 사용하여 구현
2. Clerk 설정 완료 후 `home-header.tsx`만 수정
3. 나머지 페이지 구조는 변경 불필요

### 10.3 DRY 원칙 준수

- **재사용 가능한 컴포넌트 분리**
  - Feature 카드 컴포넌트는 별도 파일로 분리
  - 공통 섹션 레이아웃은 일관된 구조 사용

- **스타일 중복 방지**
  - Tailwind CSS 유틸리티 클래스 사용
  - 공통 스타일은 `@apply` 디렉티브로 추출 (필요 시)

- **타입 정의 공유**
  - Feature 카드 Props 타입 명확히 정의
  - FAQ 데이터 타입 정의

### 10.4 성능 고려사항

- **Client Component 최소화**
  - 대부분의 콘텐츠는 정적이므로 Server Component 사용 가능
  - 인증 상태가 필요한 부분만 Client Component로 분리

- **이미지 최적화**
  - 필요 시 Next.js Image 컴포넌트 사용
  - 적절한 이미지 크기 및 포맷 선택

- **코드 스플리팅**
  - Next.js가 자동으로 처리하므로 별도 작업 불필요

### 10.5 접근성 (a11y)

- **ARIA 라벨 추가**
  - 네비게이션 메뉴에 `aria-label` 추가
  - 버튼에 명확한 레이블 제공

- **키보드 네비게이션**
  - 모든 인터랙티브 요소에 키보드 접근 가능
  - Tab 순서 논리적으로 구성

- **색상 대비**
  - WCAG AA 기준 준수
  - 텍스트와 배경 간 충분한 대비

### 10.6 SEO 최적화

- **메타데이터 설정**
  ```tsx
  // src/app/page.tsx
  export const metadata = {
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석. 무료로 전문가 수준의 상세한 분석을 받아보세요.',
    openGraph: {
      title: 'Vibe Fortune - AI 기반 사주분석 서비스',
      description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
      images: ['/og-image.png'],
    },
  };
  ```

- **의미론적 HTML**
  - 적절한 시맨틱 태그 사용 (`<header>`, `<section>`, `<article>`)
  - 제목 계층 구조 유지 (`<h1>`, `<h2>`, `<h3>`)

### 10.7 에러 처리

- **네트워크 에러**
  - 정적 콘텐츠는 항상 표시됨
  - Clerk 세션 확인 실패 시 비로그인 상태로 간주

- **세션 만료**
  - Clerk가 자동으로 처리
  - 사용자는 "시작하기" 버튼을 통해 다시 로그인 가능

### 10.8 브라우저 호환성

- **모던 브라우저 지원**
  - Chrome, Firefox, Safari, Edge 최신 버전
  - CSS Grid 및 Flexbox 사용

- **폴백 처리**
  - 스크롤 애니메이션 미지원 브라우저: 즉시 이동
  - Clerk 로딩 실패: 기본 로그인 링크 표시

### 10.9 테스트 체크리스트

구현 완료 후 다음 항목을 테스트하세요:

- [ ] 비로그인 상태에서 "시작하기" 버튼 작동
- [ ] 로그인 상태에서 "이용하기" 버튼 작동 및 대시보드 이동
- [ ] 앵커 네비게이션 (홈, 서비스, 가격, FAQ) 작동
- [ ] 모든 섹션이 올바르게 렌더링됨
- [ ] FAQ Accordion 열림/닫힘 작동
- [ ] 모바일 화면에서 레이아웃 정상 표시
- [ ] 태블릿 화면에서 레이아웃 정상 표시
- [ ] 데스크톱 화면에서 레이아웃 정상 표시
- [ ] 키보드 네비게이션 (Tab, Enter) 작동
- [ ] 스크린 리더 호환성 (선택사항)

---

## 11. 컨텐츠 참고자료

### 11.1 헤드라인 예시

- **메인**: "AI가 분석하는 나만의 사주팔자"
- **서브**: "Google 계정으로 1분 안에 시작하세요"

### 11.2 Feature 설명

1. **AI 기반 전문 분석**
   - Google Gemini API를 활용한 20년 경력 사주상담사 수준의 분석
   - 천간, 지지, 오행, 대운, 세운 등 상세한 해석

2. **간편한 Google 로그인**
   - 클릭 한 번으로 시작
   - 복잡한 회원가입 절차 없음

3. **분석 이력 관리**
   - 과거 분석 결과를 언제든 다시 확인 가능
   - 대시보드에서 모든 이력 조회

4. **마크다운 렌더링**
   - 보기 쉽고 구조화된 분석 결과 제공
   - 복사 및 저장 가능

### 11.3 Pricing 혜택

- 무제한 사주분석
- 이력 관리
- AI 기반 상세 분석
- 광고 없음

---

## 12. 참고 문서

- `/docs/prd.md` - 제품 요구사항 명세서
- `/docs/requirement.md` - 요구사항 정의서
- `/docs/userflow.md` - 사용자 플로우 명세서
- `/docs/common-modules.md` - 공통 모듈 계획
- `/docs/usecases/5-landing-page/spec.md` - 랜딩 페이지 유스케이스

---

## 13. 구현 우선순위

### P0 (최고 우선순위)
1. Hero 섹션 - 핵심 메시지 전달
2. Features 섹션 - 주요 기능 소개
3. 헤더 네비게이션 - 인증 상태 처리
4. CTA 버튼 - 대시보드 이동

### P1 (높은 우선순위)
5. Pricing 섹션 - 무료 이용 강조
6. FAQ 섹션 - 사용자 의문 해소
7. 반응형 디자인
8. 앵커 네비게이션

### P2 (중간 우선순위)
9. 스크롤 애니메이션
10. 접근성 개선
11. SEO 최적화

---

## 14. 완료 조건

이 페이지 구현이 완료되었다고 판단하는 기준:

1. **기능 완성도**
   - [ ] Hero, Features, Pricing, FAQ 섹션 모두 렌더링됨
   - [ ] 로그인 여부에 따른 CTA 버튼 동작 확인
   - [ ] 앵커 네비게이션 작동 확인

2. **반응형 디자인**
   - [ ] 모바일, 태블릿, 데스크톱 모든 화면에서 정상 표시

3. **코드 품질**
   - [ ] TypeScript 컴파일 에러 없음
   - [ ] ESLint 경고 없음
   - [ ] DRY 원칙 준수

4. **사용자 경험**
   - [ ] 페이지 로딩 속도 3초 이내
   - [ ] 부드러운 스크롤 애니메이션
   - [ ] 명확한 CTA 버튼

5. **통합 테스트**
   - [ ] 비로그인 → 로그인 플로우 테스트
   - [ ] 로그인 → 대시보드 이동 테스트
   - [ ] 모든 섹션 네비게이션 테스트

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
