# 홈 (랜딩 페이지) 구현 계획

## 문서 정보

- **페이지명**: 홈 (랜딩 페이지)
- **라우트**: `/`
- **작성일**: 2025-10-27
- **최종 수정일**: 2025-10-28
- **관련 문서**: PRD 3.3.1, requirement.md, userflow.md

---

## 1. 페이지 개요 및 목표

### 1.1 페이지 목적

신규 방문자에게 Vibe Fortune 서비스의 핵심 가치를 전달하고, 사용자 유입 및 회원가입을 유도하는 랜딩 페이지입니다.

**핵심 목표**:
- 서비스의 차별화된 가치 제안 (AI 기반 사주분석)
- 무료 체험 및 Pro 구독 모델 소개
- 간편한 가입 프로세스 강조 (Google OAuth)
- 신뢰도 구축 (FAQ, 투명한 가격 정책)

### 1.2 주요 기능

- **Hero 섹션**: 핵심 가치 제안 및 즉시 행동 유도
- **Features 섹션**: 4가지 주요 기능 소개
- **Pricing 섹션**: 무료 + Pro 요금제 비교
- **FAQ 섹션**: 자주 묻는 질문 (6개)
- **앵커 네비게이션**: 섹션 간 부드러운 스크롤
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

### 1.3 핵심 가치 제안

- **간편한 접근성**: Google 계정으로 1분 안에 시작 가능
- **AI 기반 전문성**: Gemini API를 활용한 20년 경력 사주상담사 수준의 분석
- **이력 관리**: 과거 사주분석 결과를 언제든 재확인
- **유연한 구독 모델**: 무료 체험 후 필요시 Pro 구독으로 업그레이드
- **실시간 스트리밍**: AI 분석 결과를 실시간으로 확인

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

## 3. 화면 구성 요소

### 3.1 헤더 (Header)

**위치**: 페이지 최상단, 고정 (sticky)

**구성 요소**:
- 로고 (좌측): "Vibe Fortune" 텍스트 + 아이콘
- 앵커 메뉴 (중앙): 홈, 서비스, 가격, FAQ
- 사용자 메뉴 (우측):
  - 비로그인: "시작하기" 버튼
  - 로그인: "이용하기" 버튼 + UserButton

**인터랙션**:
- 로고 클릭: 페이지 최상단으로 스크롤
- 앵커 메뉴 클릭: 해당 섹션으로 스크롤
- "시작하기": Clerk 로그인 모달 오픈
- "이용하기": `/dashboard`로 이동

**기술 스택**:
- Clerk SDK: `SignedIn`, `SignedOut`, `SignInButton`, `UserButton`
- Next.js Link 컴포넌트

**반응형**:
- 모바일: 햄버거 메뉴 (선택사항)
- 태블릿/데스크톱: 전체 메뉴 표시

---

### 3.2 Hero 섹션

**ID**: `#hero`

**구성 요소**:
1. **메인 헤드라인**
   - 텍스트: "AI가 분석하는 나만의 사주팔자"
   - 스타일: 대형 제목, 그라디언트 텍스트

2. **서브 헤드라인**
   - 텍스트: "Google 계정으로 1분 안에 시작하세요"
   - 스타일: 중형 텍스트, 부드러운 색상

3. **CTA 버튼**
   - 비로그인: "무료로 시작하기" (Clerk SignInButton)
   - 로그인: "이용하기" (대시보드 링크)
   - 크기: Large, 눈에 띄는 색상

4. **배경**
   - 그라디언트 배경 (옵션)
   - 또는 추상적인 이미지

**레이아웃**:
- 중앙 정렬
- 수직 패딩: 큼 (py-20 md:py-32)

**반응형**:
- 모바일: 작은 제목 크기, 버튼 전체 너비
- 데스크톱: 큰 제목 크기, 버튼 인라인

---

### 3.3 Features 섹션

**ID**: `#features`

**구성 요소**:
1. **섹션 제목**: "주요 기능"

2. **Feature 카드 (4개)**:

   **1) AI 기반 전문 분석**
   - 아이콘: Sparkles (lucide-react)
   - 제목: "AI 기반 전문 분석"
   - 설명: "Gemini API를 활용한 20년 경력 사주상담사 수준의 분석"

   **2) 간편한 Google 로그인**
   - 아이콘: UserCircle
   - 제목: "간편한 Google 로그인"
   - 설명: "클릭 한 번으로 시작, 복잡한 회원가입 절차 없음"

   **3) 분석 이력 관리**
   - 아이콘: History
   - 제목: "분석 이력 관리"
   - 설명: "과거 분석 결과를 언제든 다시 확인 가능"

   **4) 실시간 스트리밍**
   - 아이콘: Zap
   - 제목: "실시간 스트리밍"
   - 설명: "AI 분석 결과를 실시간으로 확인하며 기다림 없는 경험"

**레이아웃**:
- 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- 간격: `gap-6`
- 카드: shadcn/ui Card 컴포넌트

**카드 스타일**:
- 배경: 흰색 또는 연한 그레이
- 그림자: subtle shadow
- 호버 효과: 약간 확대 (scale-105)

---

### 3.4 Pricing 섹션

**ID**: `#pricing`

**구성 요소**:
1. **섹션 제목**: "요금 안내"

2. **요금제 카드 (2개)**:

   **무료 요금제**:
   - 제목: "무료"
   - 가격: "₩0"
   - 설명: "누구나 무료로 시작"
   - 혜택:
     - ✅ 초기 3회 분석 가능
     - ✅ 기본 AI 분석 (gemini-2.5-flash)
     - ✅ 분석 이력 저장
     - ✅ 마크다운 결과 복사
   - CTA 버튼: "무료로 시작하기"

   **Pro 요금제**:
   - 제목: "Pro"
   - 가격: "₩9,900 /월"
   - 설명: "고급 분석과 더 많은 혜택"
   - 혜택:
     - ✅ 월 10회 분석 가능
     - ✅ 고급 AI 분석 (gemini-2.5-pro)
     - ✅ 직업운, 사업운 분석
     - ✅ 월별 운세 및 길일 분석
     - ✅ 우선 지원
   - 배지: "인기" (Popular)
   - CTA 버튼: "Pro 시작하기"

**레이아웃**:
- 2열 그리드 (모바일: 1열)
- Pro 카드 강조 (테두리, 배지, 그림자)
- 중앙 정렬

**반응형**:
- 모바일: 세로 배치
- 태블릿/데스크톱: 가로 배치 (2열)

---

### 3.5 FAQ 섹션

**ID**: `#faq`

**구성 요소**:
1. **섹션 제목**: "자주 묻는 질문"

2. **FAQ 아코디언 (6개)**:

   **Q1: 어떻게 사용하나요?**
   - A: Google 계정으로 로그인 후 생년월일과 출생시간을 입력하면 AI가 자동으로 사주를 분석해드립니다.

   **Q2: 무료 체험 후 비용이 발생하나요?**
   - A: 초기 3회는 무료로 이용하실 수 있습니다. 이후 월 9,900원의 Pro 구독을 통해 월 10회 고급 분석을 이용하실 수 있습니다.

   **Q3: Pro 구독과 무료 버전의 차이는 무엇인가요?**
   - A: Pro 구독은 더 정교한 AI 모델(gemini-2.5-pro)을 사용하며, 직업운, 사업운, 월별 운세 등 추가 분석을 제공합니다. 또한 월 10회까지 분석이 가능합니다.

   **Q4: 개인정보는 안전한가요?**
   - A: 네, 모든 데이터는 암호화되어 안전하게 저장되며, Google 인증을 통해 보안이 강화되어 있습니다. 사주분석 결과는 본인만 확인할 수 있습니다.

   **Q5: 출생시간을 모르는 경우에도 가능한가요?**
   - A: 네, 출생시간을 모르시는 경우 "출생시간 모름"을 선택하시면 됩니다. 다만 더 정확한 분석을 위해서는 출생시간 입력을 권장합니다.

   **Q6: 구독은 언제든지 취소할 수 있나요?**
   - A: 네, Pro 구독은 언제든지 취소 가능하며, 다음 결제일까지 Pro 혜택이 유지됩니다.

**레이아웃**:
- shadcn/ui Accordion 컴포넌트
- 최대 너비: `max-w-3xl mx-auto`
- 아이템 간격: 적절한 패딩

**스타일**:
- 질문: 굵은 글씨
- 답변: 일반 글씨, 연한 색상
- 열림/닫힘 애니메이션

---

### 3.6 Footer

**구성 요소**:
- 서비스명: "Vibe Fortune"
- 저작권 정보: "© 2025 Vibe Fortune. All rights reserved."
- 링크 (선택사항):
  - 이용약관
  - 개인정보처리방침

**레이아웃**:
- 중앙 정렬
- 연한 배경색
- 적절한 패딩

---

## 4. 사용할 공통 모듈 목록

### 4.1 인증 관련

- **Clerk SDK**:
  - `@clerk/nextjs` - SignedIn, SignedOut, SignInButton, UserButton
  - Clerk 세션 상태 확인
  - 로그인/로그아웃 처리

### 4.2 UI 컴포넌트

- **레이아웃 컴포넌트**:
  - `src/components/layout/home-header.tsx` - 홈 페이지 전용 헤더

- **shadcn/ui 컴포넌트**:
  - `Button` - CTA 버튼, 네비게이션 버튼
  - `Card` - Features, Pricing 카드
  - `Accordion` - FAQ 섹션
  - `Badge` - Pro 요금제 배지

### 4.3 유틸리티

- `src/lib/utils.ts` - cn() 유틸리티 (클래스명 병합)
- Next.js Link, Image 컴포넌트

### 4.4 아이콘

- `lucide-react` - 아이콘 컴포넌트:
  - Sparkles (AI 분석)
  - UserCircle (Google 로그인)
  - History (이력 관리)
  - Zap (실시간 스트리밍)
  - Check (혜택 체크마크)

---

## 5. 컴포넌트 구조 및 파일 구조

### 5.1 컴포넌트 계층 구조

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
│       └── 실시간 스트리밍
│
├── PricingSection
│   ├── Section Title
│   └── Pricing Cards (2개)
│       ├── 무료 요금제
│       └── Pro 요금제 (강조)
│
├── FAQSection
│   ├── Section Title
│   └── FAQ Accordion (6개)
│
└── Footer
    ├── Service Name
    ├── Copyright
    └── Links (선택)
```

### 5.2 파일 구조

```
src/app/page.tsx                              # 메인 페이지 (수정)
src/components/layout/home-header.tsx         # 홈 헤더 (기존)
src/components/home/hero-section.tsx          # Hero 섹션
src/components/home/features-section.tsx      # Features 섹션
src/components/home/feature-card.tsx          # Feature 카드
src/components/home/pricing-section.tsx       # Pricing 섹션
src/components/home/pricing-card.tsx          # Pricing 카드
src/components/home/faq-section.tsx           # FAQ 섹션
src/components/home/footer.tsx                # Footer
```

### 5.3 디렉토리 구조

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
│   │   ├── pricing-card.tsx
│   │   ├── faq-section.tsx
│   │   └── footer.tsx
│   │
│   └── ui/                            # shadcn/ui 컴포넌트 (기존)
│       ├── button.tsx
│       ├── card.tsx
│       ├── accordion.tsx
│       └── badge.tsx
│
└── lib/
    └── utils.ts                       # 유틸리티 (기존)
```

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

## 7. 상호작용 및 네비게이션

### 7.1 사용자 인터랙션

**헤더**:
- 로고 클릭 → 페이지 최상단 스크롤
- 앵커 메뉴 클릭 → 해당 섹션 스크롤
- "시작하기" 클릭 → Clerk 로그인 모달
- "이용하기" 클릭 → `/dashboard` 이동

**Hero 섹션**:
- CTA 버튼 클릭 → 로그인 또는 대시보드 이동

**Pricing 섹션**:
- "무료로 시작하기" → 로그인 후 대시보드
- "Pro 시작하기" → 로그인 후 구독 관리 페이지

**FAQ 섹션**:
- 질문 클릭 → Accordion 열림/닫힘

### 7.2 앵커 네비게이션

**섹션 ID**:
- `#hero`
- `#features`
- `#pricing`
- `#faq`

**구현**:
```tsx
// 부드러운 스크롤
<a href="#features" className="scroll-smooth">
  서비스
</a>

// 또는 JavaScript
const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};
```

### 7.3 CTA 버튼 플로우

```
비로그인 사용자:
  "무료로 시작하기" → Clerk 로그인 모달 → 대시보드

로그인 사용자:
  "이용하기" → 직접 대시보드 이동
```

---

## 8. 반응형 디자인 고려사항

### 8.1 브레이크포인트

- **모바일**: 320px ~ 767px (기본 스타일)
- **태블릿**: 768px ~ 1023px (`md:` 접두사)
- **데스크톱**: 1024px 이상 (`lg:` 접두사)

### 8.2 레이아웃 변화

**헤더**:
- 모바일: 햨버거 메뉴 (선택사항)
- 태블릿/데스크톱: 전체 메뉴 표시

**Hero 섹션**:
- 모바일: 작은 제목, 버튼 전체 너비
- 데스크톱: 큰 제목, 버튼 인라인

**Features 섹션**:
- 모바일: 1열 (`grid-cols-1`)
- 태블릿: 2열 (`md:grid-cols-2`)
- 데스크톱: 4열 (`lg:grid-cols-4`)

**Pricing 섹션**:
- 모바일: 1열 (세로 배치)
- 태블릿/데스크톱: 2열 (가로 배치)

### 8.3 타이포그래피

```tsx
// Hero 헤드라인
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
  AI가 분석하는 나만의 사주팔자
</h1>

// 섹션 제목
<h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">
  주요 기능
</h2>

// 본문
<p className="text-base md:text-lg">
  설명 텍스트
</p>
```

### 8.4 여백 및 패딩

```tsx
// 섹션 간격
<section className="py-12 md:py-16 lg:py-20">

// 컨테이너 패딩
<div className="px-4 md:px-6 lg:px-8">

// 최대 너비
<div className="max-w-7xl mx-auto">
```

---

## 9. 성능 최적화 사항

### 9.1 코드 스플리팅

- Next.js가 자동으로 처리
- 각 섹션 컴포넌트는 별도 파일로 분리
- Dynamic Import 불필요 (정적 콘텐츠)

### 9.2 이미지 최적화

- Next.js Image 컴포넌트 사용 (필요 시)
- WebP 포맷 사용
- Lazy loading 적용

### 9.3 Server Component vs Client Component

**Server Component (기본)**:
- Hero 섹션 (정적 콘텐츠)
- Features 섹션 (정적 콘텐츠)
- Pricing 섹션 (정적 콘텐츠)
- FAQ 섹션 (정적 콘텐츠)

**Client Component (필요한 경우만)**:
- HomeHeader (Clerk 세션 확인)
- CTA 버튼 (인증 상태 확인)

```tsx
// 최소한의 클라이언트 컴포넌트
'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';

export function CTAButton() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button>무료로 시작하기</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard">
          <Button>이용하기</Button>
        </Link>
      </SignedIn>
    </>
  );
}
```

### 9.4 CSS 최적화

- Tailwind CSS의 Purge 기능 활용
- 사용하지 않는 스타일 자동 제거
- 최소한의 커스텀 CSS

### 9.5 폰트 최적화

```tsx
// layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
```

---

## 10. 접근성 요구사항

### 10.1 ARIA 속성

```tsx
// 네비게이션
<nav aria-label="Main navigation">
  <ul>
    <li><a href="#hero">홈</a></li>
    <li><a href="#features">서비스</a></li>
    <li><a href="#pricing">가격</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
</nav>

// 버튼
<button aria-label="로그인하기">시작하기</button>

// 섹션
<section aria-labelledby="features-title">
  <h2 id="features-title">주요 기능</h2>
</section>
```

### 10.2 키보드 네비게이션

- 모든 인터랙티브 요소에 Tab 접근 가능
- Enter/Space로 버튼 활성화
- Esc로 모달 닫기
- 포커스 표시 명확화 (`focus:ring-2`)

### 10.3 색상 대비

- WCAG AA 기준 준수 (4.5:1)
- 텍스트와 배경 간 충분한 대비
- 링크 색상 명확히 구분

### 10.4 의미론적 HTML

```tsx
<header>
  <nav>...</nav>
</header>

<main>
  <section id="hero">
    <h1>메인 제목</h1>
  </section>

  <section id="features">
    <h2>주요 기능</h2>
    <article>
      <h3>AI 기반 전문 분석</h3>
    </article>
  </section>
</main>

<footer>
  <p>Copyright</p>
</footer>
```

---

## 11. SEO 최적화

### 11.1 메타데이터

```tsx
// src/app/page.tsx
export const metadata = {
  title: 'Vibe Fortune - AI 기반 사주분석 서비스',
  description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석. 무료 체험 후 Pro 구독으로 월 10회 고급 분석을 이용하세요.',
  keywords: ['사주분석', 'AI 사주', '사주팔자', 'Gemini AI', '무료 사주'],
  openGraph: {
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
    images: ['/og-image.png'],
  },
};
```

### 11.2 구조화된 데이터 (JSON-LD)

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Vibe Fortune',
      description: 'AI 기반 사주분석 서비스',
      applicationCategory: 'LifestyleApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
    }),
  }}
/>
```

---

## 12. 구현 단계별 계획

### Phase 1: 기본 구조 설정 (30분)

**작업 내용**:
1. 컴포넌트 디렉토리 생성
   ```bash
   mkdir -p src/components/home
   ```

2. 기본 섹션 컴포넌트 생성
   - `hero-section.tsx`
   - `features-section.tsx`
   - `pricing-section.tsx`
   - `faq-section.tsx`
   - `footer.tsx`

3. 메인 페이지 리팩토링
   - `src/app/page.tsx` 수정
   - 기존 코드 제거
   - 새 섹션 컴포넌트 import 및 배치

**완료 조건**:
- 모든 섹션 컴포넌트 파일 생성 완료
- `page.tsx`에서 import 에러 없음
- 빈 섹션이지만 페이지 렌더링 성공

---

### Phase 2: Hero 섹션 구현 (20분)

**작업 내용**:
1. Hero 섹션 레이아웃 작성
   - 중앙 정렬 컨테이너
   - 그라디언트 배경
   - 반응형 여백 및 패딩

2. 헤드라인 구현
   - 메인 헤드라인 텍스트
   - 서브 헤드라인 텍스트
   - 타이포그래피 스타일링

3. CTA 버튼 구현
   - Clerk SDK 통합
   - 로그인 상태에 따른 조건부 렌더링

**완료 조건**:
- Hero 섹션 렌더링 성공
- CTA 버튼 작동 (로그인 모달 또는 대시보드 이동)
- 반응형 디자인 적용

---

### Phase 3: Features 섹션 구현 (30분)

**작업 내용**:
1. Feature 카드 컴포넌트 작성
   - Props 타입 정의
   - Card UI 컴포넌트 사용
   - 아이콘 및 텍스트 레이아웃

2. Features 섹션 작성
   - 섹션 제목
   - 4개 Feature 카드 배치
   - 반응형 그리드 레이아웃

3. 콘텐츠 작성
   - 각 Feature별 아이콘, 제목, 설명 입력

**완료 조건**:
- 4개 Feature 카드 렌더링
- 그리드 레이아웃 정상 작동
- 모바일/태블릿/데스크톱 반응형 확인

---

### Phase 4: Pricing 섹션 구현 (30분)

**작업 내용**:
1. Pricing 카드 컴포넌트 작성
   - Props 타입 정의
   - 무료 vs Pro 스타일 차별화

2. Pricing 섹션 작성
   - 섹션 제목
   - 2개 Pricing 카드 배치
   - Pro 카드 강조 (배지, 테두리)

3. 혜택 목록 작성
   - 체크 아이콘 + 텍스트
   - 무료 3회 vs 월 10회 명확히 표시

**완료 조건**:
- 2개 Pricing 카드 렌더링
- Pro 카드 강조 스타일 적용
- CTA 버튼 작동 확인

---

### Phase 5: FAQ 섹션 구현 (25분)

**작업 내용**:
1. FAQ 데이터 준비
   - 6개 질문과 답변 작성
   - 데이터 배열 구조화

2. Accordion 컴포넌트 통합
   - shadcn/ui Accordion 사용
   - FAQ 데이터 매핑

3. 스타일링
   - Accordion 아이템 스타일
   - 열림/닫힘 애니메이션

**완료 조건**:
- 6개 FAQ 아이템 렌더링
- Accordion 열림/닫힘 작동
- 스타일링 완료

---

### Phase 6: Footer 구현 (10분)

**작업 내용**:
1. Footer 레이아웃
   - 서비스명
   - 저작권 정보
   - 링크 (선택사항)

2. 스타일링
   - 연한 배경색
   - 중앙 정렬
   - 적절한 패딩

**완료 조건**:
- Footer 렌더링
- 스타일링 완료

---

### Phase 7: 앵커 네비게이션 구현 (15분)

**작업 내용**:
1. 섹션 ID 부여
   - 각 섹션에 고유 ID 추가

2. 헤더 메뉴 링크 연결
   - `home-header.tsx` 확인 (이미 구현되어 있음)
   - 필요시 앵커 링크 추가

3. 스크롤 애니메이션
   - CSS `scroll-behavior: smooth` 적용
   - 또는 JavaScript `scrollIntoView({ behavior: 'smooth' })`

**완료 조건**:
- 앵커 링크 클릭 시 해당 섹션으로 스크롤
- 부드러운 애니메이션 적용

---

### Phase 8: 반응형 디자인 적용 (20분)

**작업 내용**:
1. Tailwind 브레이크포인트 적용
   - 모바일: 기본 스타일
   - 태블릿: `md:` 접두사
   - 데스크톱: `lg:` 접두사

2. 그리드 레이아웃 조정
   - Features 섹션: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
   - Pricing 섹션: `grid-cols-1 md:grid-cols-2`

3. 여백 및 패딩 조정
   - 각 섹션별 반응형 여백

**완료 조건**:
- 모바일 화면에서 정상 렌더링
- 태블릿 화면에서 정상 렌더링
- 데스크톱 화면에서 정상 렌더링

---

### Phase 9: 스타일링 및 최종 점검 (30분)

**작업 내용**:
1. 전체 페이지 스타일링
   - 색상 테마 통일
   - 일관된 타이포그래피
   - 간격 및 정렬

2. 접근성 개선
   - ARIA 라벨 추가
   - 키보드 네비게이션 테스트
   - 스크린 리더 호환성 확인

3. 성능 최적화
   - 이미지 최적화 (필요 시)
   - 불필요한 렌더링 방지

4. 최종 테스트
   - 로그인/로그아웃 플로우 테스트
   - 모든 섹션 네비게이션 테스트
   - 다양한 화면 크기 테스트

**완료 조건**:
- 모든 기능 정상 작동
- 스타일링 완료
- 테스트 통과

---

## 13. 주의사항 및 체크리스트

### 13.1 코드베이스 호환성

**기존 홈 페이지 교체**:
- 현재 `src/app/page.tsx`는 기존 코드가 있을 수 있음
- 전체 내용을 Vibe Fortune 랜딩 페이지로 교체
- 필요 시 기존 코드 백업

**인증 방식**:
- Clerk SDK 사용
- `SignedIn`, `SignedOut` 컴포넌트로 조건부 렌더링

**레이아웃 재사용**:
- `home-header.tsx` 확인 후 재사용 또는 수정

### 13.2 DRY 원칙 준수

- Feature 카드, Pricing 카드는 별도 컴포넌트로 분리
- 공통 스타일은 Tailwind CSS 유틸리티 클래스 사용
- 타입 정의 명확히 (Props 인터페이스)

### 13.3 성능 고려사항

- Server Component 최대한 활용
- Client Component는 최소화 (Clerk 관련만)
- 이미지 최적화 (Next.js Image)
- 코드 스플리팅 (자동)

### 13.4 접근성 (a11y)

- ARIA 라벨 추가
- 키보드 네비게이션 지원
- 색상 대비 WCAG AA 준수
- 의미론적 HTML 사용

### 13.5 SEO 최적화

- 메타데이터 설정 (title, description, OG)
- 구조화된 데이터 (JSON-LD)
- 의미론적 HTML
- 제목 계층 구조 유지

### 13.6 에러 처리

- Clerk 로딩 실패: 기본 로그인 링크 표시
- 네트워크 에러: 정적 콘텐츠는 항상 표시
- 세션 만료: 비로그인 상태로 간주

### 13.7 테스트 체크리스트

구현 완료 후 다음 항목을 테스트하세요:

- [ ] 비로그인 상태에서 "무료로 시작하기" 버튼 작동
- [ ] 로그인 상태에서 "이용하기" 버튼 작동 및 대시보드 이동
- [ ] 앵커 네비게이션 (홈, 서비스, 가격, FAQ) 작동
- [ ] 모든 섹션이 올바르게 렌더링됨
- [ ] FAQ Accordion 열림/닫힘 작동
- [ ] Pricing 카드 CTA 버튼 작동
- [ ] 모바일 화면에서 레이아웃 정상 표시
- [ ] 태블릿 화면에서 레이아웃 정상 표시
- [ ] 데스크톱 화면에서 레이아웃 정상 표시
- [ ] 키보드 네비게이션 (Tab, Enter) 작동
- [ ] 스크린 리더 호환성 (선택사항)

---

## 14. 완료 조건

이 페이지 구현이 완료되었다고 판단하는 기준:

### 14.1 기능 완성도

- [ ] Hero, Features, Pricing, FAQ, Footer 섹션 모두 렌더링됨
- [ ] 로그인 여부에 따른 CTA 버튼 동작 확인
- [ ] 앵커 네비게이션 작동 확인
- [ ] 무료 vs Pro 요금제 명확히 표시

### 14.2 반응형 디자인

- [ ] 모바일, 태블릿, 데스크톱 모든 화면에서 정상 표시

### 14.3 코드 품질

- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 경고 없음
- [ ] DRY 원칙 준수
- [ ] 명확한 컴포넌트 분리

### 14.4 사용자 경험

- [ ] 페이지 로딩 속도 3초 이내
- [ ] 부드러운 스크롤 애니메이션
- [ ] 명확한 CTA 버튼
- [ ] 직관적인 네비게이션

### 14.5 통합 테스트

- [ ] 비로그인 → 로그인 플로우 테스트
- [ ] 로그인 → 대시보드 이동 테스트
- [ ] 모든 섹션 네비게이션 테스트
- [ ] 다양한 화면 크기 테스트

---

## 15. 구현 우선순위

### P0 (최고 우선순위)

1. **Hero 섹션** - 핵심 메시지 전달
2. **Features 섹션** - 주요 기능 소개
3. **Pricing 섹션** - 무료 vs Pro 명확히 표시
4. **헤더 네비게이션** - 인증 상태 처리
5. **CTA 버튼** - 대시보드 이동

### P1 (높은 우선순위)

6. **FAQ 섹션** - 사용자 의문 해소
7. **반응형 디자인** - 모바일/태블릿/데스크톱
8. **앵커 네비게이션** - 섹션 간 이동

### P2 (중간 우선순위)

9. **Footer** - 저작권 정보
10. **스크롤 애니메이션** - UX 개선
11. **접근성 개선** - ARIA, 키보드
12. **SEO 최적화** - 메타데이터, JSON-LD

---

## 16. 참고 문서

- `/docs/prd.md` - 제품 요구사항 명세서 (PRD 3.3.1)
- `/docs/requirement.md` - 요구사항 정의서 (3.1)
- `/docs/userflow.md` - 사용자 플로우 명세서 (1.1)
- `/docs/common-modules.md` - 공통 모듈 계획
- `/docs/database.md` - 데이터베이스 설계
- `/docs/external/tosspayments.md` - 토스페이먼츠 연동 가이드

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
| 2.0 | 2025-10-28 | Claude Code | Pro 구독 추가, Pricing 섹션 업데이트, FAQ 업데이트, 전체 구조 개선 |
