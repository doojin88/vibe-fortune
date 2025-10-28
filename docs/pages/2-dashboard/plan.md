# 대시보드 페이지 구현 계획

## 문서 개요

본 문서는 대시보드 페이지(`/dashboard`)의 구체적인 구현 계획을 정의합니다.

**작성 원칙:**
- PRD, userflow, database, common-modules 문서에 명시된 내용만 구현
- 오버엔지니어링 금지
- 기존 코드베이스와 충돌하지 않도록 설계

**최근 변경사항 (2025-10-28):**
- 구독 관리 기능 추가 (사이드바에 구독 정보 표시 필요)
- 검색 기능 추가 (검사자 이름으로 검색)
- 페이지네이션 추가 ("더보기" 버튼 방식)

---

## 1. 페이지 개요 및 목적

### 1.1 목적
사용자가 과거에 수행한 사주분석 이력을 조회하고, 새로운 사주분석을 시작할 수 있는 중앙 관리 페이지

### 1.2 주요 기능
- 사주분석 이력 목록 조회 (최신순 정렬)
- **검색 기능**: 검사자 이름으로 실시간 검색
- 이력 카드 클릭을 통한 상세 페이지 이동
- 새 검사하기 버튼을 통한 새 분석 시작
- 빈 상태 처리 (이력 없을 때)
- **페이지네이션**: "더보기" 버튼 방식 (10개씩 로드)
- **사이드바**: 구독 정보 표시 (이메일, 잔여 횟수, 요금제, 다음 결제일)

### 1.3 제외 사항
- 이력 삭제 기능
- 고급 필터링 (날짜, 성별 등)
- 이력 수정 기능
- 무한 스크롤 (더보기 버튼 방식만 사용)

---

## 2. 공용 레이아웃 통합

### 2.1 현재 레이아웃 구조

```
(protected) Layout
├── DashboardHeader (헤더)
│   ├── 서비스명 (Vibe Fortune)
│   ├── 네비게이션 (대시보드, 새 검사)
│   └── UserButton (Clerk)
│
└── children (페이지 컨텐츠)
```

### 2.2 추가 필요: 사이드바

**위치**: `src/components/layout/dashboard-sidebar.tsx`

**목적**: 모든 protected 페이지에 표시될 고정 사이드바

**표시 정보**:
- 사용자 이메일
- 현재 요금제 (무료/Pro/Pro(취소 예약))
- 잔여 검사 횟수
- 다음 결제일 (Pro 구독자만)
- 메뉴 링크 (대시보드, 새 검사, 구독 관리)

**구독 상태별 표시**:

| 상태 | 요금제 표시 | 잔여 횟수 | 다음 결제일 | 특이사항 |
|------|-------------|-----------|-------------|----------|
| free | 무료 요금제 | 0-3회 | - | 초기 3회만 |
| pro | Pro 요금제 | 0-10회 | YYYY-MM-DD | 월 10회 갱신 |
| cancelled | Pro (취소 예약) | 0-10회 | YYYY-MM-DD (해지 예정) | 다음 결제일까지 Pro 유지 |
| payment_failed | 결제 실패 | 0-10회 | - | 경고 메시지 표시 |

**반응형 처리**:
- 데스크톱 (1024px 이상): 좌측 고정 사이드바
- 태블릿/모바일: Sheet 컴포넌트로 햄버거 메뉴

---

## 3. 라우트 및 접근 권한

### 3.1 라우트 정보
- **경로**: `/dashboard`
- **레이아웃**: `(protected)` 레이아웃 그룹 사용
- **파일 위치**: `src/app/(protected)/dashboard/page.tsx`

### 3.2 접근 권한
- **필수 조건**: Clerk 로그인 필요
- **미들웨어**: Clerk Middleware가 자동으로 인증 체크
- **비로그인 시**: Clerk 로그인 페이지로 자동 리다이렉트
- **returnUrl**: 로그인 후 대시보드로 복귀

### 3.3 보안
- RLS (Row Level Security): Supabase에서 본인 데이터만 조회 가능
- 서버 컴포넌트: 데이터 페칭은 서버에서만 수행
- 클라이언트 노출 최소화: 민감 정보 없음

---

## 4. 사용할 공통 모듈 목록

### 4.1 이미 구현된 모듈

#### 데이터베이스 및 타입
- `src/lib/supabase/types.ts`: Database 타입 정의
- `src/lib/supabase/server-client.ts`: Supabase Server Client
- `src/features/saju/types/result.ts`: SajuTestListItem 타입

#### 쿼리 함수
- `src/features/saju/queries/get-saju-tests.ts`: 사주분석 목록 조회 함수

#### 레이아웃 컴포넌트
- `src/components/layout/dashboard-header.tsx`: 대시보드 헤더
- `src/app/(protected)/layout.tsx`: Protected 레이아웃

#### UI 컴포넌트
- `src/components/ui/card.tsx`: Card 컴포넌트
- `src/components/ui/button.tsx`: Button 컴포넌트
- `src/components/ui/badge.tsx`: Badge 컴포넌트
- `src/components/ui/empty-state.tsx`: EmptyState 컴포넌트
- `src/components/ui/spinner.tsx`: Spinner 컴포넌트
- `src/components/ui/input.tsx`: Input 컴포넌트 (검색바)
- `src/components/ui/sheet.tsx`: Sheet 컴포넌트 (모바일 사이드바)

#### 유틸리티
- `src/lib/utils/date.ts`: 날짜 포맷팅 함수
- `src/lib/utils.ts`: cn (className 유틸리티)

### 4.2 추가 구현 필요

#### 사이드바 컴포넌트
- `src/components/layout/dashboard-sidebar.tsx`: 사이드바 (신규)

#### 구독 정보 조회 함수
- `src/features/subscription/queries/get-subscription.ts`: 구독 정보 조회 (common-modules에서 구현 예정)

---

## 5. 페이지 컴포넌트 구조

### 5.1 컴포넌트 계층 구조

```
(protected) Layout
├── DashboardHeader
└── DashboardLayout
    ├── DashboardSidebar (신규)
    │   ├── UserInfo
    │   │   ├── Avatar
    │   │   └── Email
    │   ├── SubscriptionInfo (신규)
    │   │   ├── 요금제 Badge
    │   │   ├── 잔여 검사 횟수
    │   │   └── 다음 결제일 (조건부)
    │   └── Navigation
    │       ├── 대시보드
    │       ├── 새 검사
    │       └── 구독 관리 (신규)
    │
    └── DashboardPage (메인)
        ├── PageHeader
        │   ├── h1: "내 사주분석 이력"
        │   ├── SearchBar (신규)
        │   └── Button: "새 검사하기"
        │
        ├── SajuTestList (조건부 렌더링)
        │   ├── (이력 있을 때) SajuTestCard[] (Client Component)
        │   ├── (이력 없을 때) EmptyState
        │   └── (더 있을 때) LoadMoreButton (신규)
        │
        └── LoadingState (Suspense fallback)
```

### 5.2 Server Component vs Client Component

#### Server Components
- `DashboardPage`: 메인 페이지 컴포넌트
  - 초기 데이터 페칭 (`getSajuTests()`)
  - 구독 정보 페칭 (`getSubscription()`)
  - 조건부 렌더링 (이력 유무)

#### Client Components
- `DashboardHeader`: 네비게이션, UserButton (기존)
- `DashboardSidebar`: 사이드바 (신규, 모바일 Sheet 포함)
- `SearchBar`: 검색 입력 (신규, 실시간 필터링)
- `SajuTestCard`: 이력 카드 (클릭 이벤트 처리)
- `LoadMoreButton`: 더보기 버튼 (신규, 페이지네이션)
- `EmptyState`: 빈 상태 화면 (버튼 클릭 이벤트, 기존)

---

## 6. 신규 구현 컴포넌트

### 6.1 DashboardSidebar

**위치**: `src/components/layout/dashboard-sidebar.tsx`

**타입**: Client Component

**Props**:
```typescript
type DashboardSidebarProps = {
  userEmail: string;
  subscriptionStatus: 'free' | 'pro' | 'cancelled' | 'payment_failed';
  testCount: number;
  nextBillingDate: string | null;
};
```

**구현 세부사항**:
- 데스크톱: 고정 좌측 사이드바 (w-64)
- 모바일: Sheet 컴포넌트 (햄버거 메뉴로 토글)
- 구독 정보 표시 (Badge, 잔여 횟수, 다음 결제일)
- 네비게이션 링크 (usePathname으로 활성 상태 표시)
- 반응형: Tailwind 브레이크포인트 활용

**구독 상태별 표시 로직**:
```typescript
const subscriptionLabel = {
  free: '무료 요금제',
  pro: 'Pro 요금제',
  cancelled: 'Pro (취소 예약)',
  payment_failed: '결제 실패',
};

const subscriptionVariant = {
  free: 'secondary',
  pro: 'default',
  cancelled: 'outline',
  payment_failed: 'destructive',
};
```

---

### 6.2 SearchBar

**위치**: `src/features/saju/components/search-bar.tsx`

**타입**: Client Component

**Props**:
```typescript
type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};
```

**구현 세부사항**:
- Input 컴포넌트 기반
- 디바운스 적용 (300ms)
- 검색 아이콘 (lucide-react Search)
- 클리어 버튼 (검색어 있을 때만 표시)
- 실시간 필터링 (onChange 이벤트)

**디바운스 구현**:
```typescript
const [query, setQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    onSearch(query);
  }, 300);

  return () => clearTimeout(timer);
}, [query, onSearch]);
```

---

### 6.3 SajuTestCard

**위치**: `src/features/saju/components/saju-test-card.tsx`

**타입**: Client Component

**Props**:
```typescript
type SajuTestCardProps = {
  test: SajuTestListItem;
};
```

**구현 세부사항**:
- Card 컴포넌트 기반
- 정보 표시: 이름, 생년월일, 성별 (Badge), 분석 날짜
- 클릭 시 상세 페이지 이동 (`/dashboard/results/${test.id}`)
- 호버 효과: 배경색 변경, 그림자 증가
- 키보드 접근성: tabIndex, onKeyDown

**날짜 포맷팅**:
- 생년월일: `YYYY-MM-DD`
- 분석 날짜: `YYYY년 MM월 DD일` 또는 상대적 시간 (예: "3일 전")

---

### 6.4 LoadMoreButton

**위치**: `src/features/saju/components/load-more-button.tsx`

**타입**: Client Component

**Props**:
```typescript
type LoadMoreButtonProps = {
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
};
```

**구현 세부사항**:
- Button 컴포넌트 기반
- 로딩 상태: Spinner 표시
- hasMore가 false이면 숨김
- 클릭 시 추가 데이터 로드

---

## 7. 구현할 기능 목록

### 7.1 데이터 로딩

#### 7.1.1 초기 데이터 로드
- **함수**: `getSajuTests()` (기존)
- **위치**: Server Component에서 호출
- **동작**:
  1. Supabase Server Client 생성
  2. 현재 사용자 ID 추출 (Clerk)
  3. analyses 테이블 쿼리
  4. 최신순 정렬 (created_at DESC)
  5. 최대 10개 제한
  6. SajuTestListItem[] 반환

#### 7.1.2 구독 정보 로드
- **함수**: `getSubscription()` (신규, common-modules에서 구현)
- **위치**: Server Component에서 호출
- **동작**:
  1. users 테이블에서 구독 상태 조회
  2. subscriptions 테이블에서 구독 상세 정보 조회 (Pro인 경우)
  3. SubscriptionInfo 타입 반환

### 7.2 검색 기능

#### 7.2.1 클라이언트 측 필터링
- **방법**: useState로 검색어 관리
- **필터링 로직**:
```typescript
const filteredTests = tests.filter((test) =>
  test.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

#### 7.2.2 디바운스
- **목적**: 불필요한 렌더링 최소화
- **지연 시간**: 300ms

### 7.3 페이지네이션

#### 7.3.1 "더보기" 버튼 방식
- **초기 로드**: 10개
- **추가 로드**: 10개씩
- **상태 관리**: useState로 offset 관리

#### 7.3.2 서버 액션
**위치**: `src/features/saju/actions/load-more-tests.ts`

```typescript
'use server';

export async function loadMoreTests(offset: number, limit = 10) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('id, name, birth_date, gender, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data.map((test) => ({
      id: test.id,
      name: test.name,
      birthDate: test.birth_date,
      gender: test.gender as 'male' | 'female',
      createdAt: test.created_at,
    })),
    hasMore: data.length === limit,
  };
}
```

### 7.4 빈 상태 처리

#### 7.4.1 조건
- 조회된 이력이 0건인 경우
- 검색 결과가 0건인 경우 (다른 메시지)

#### 7.4.2 UI
**이력 없을 때**:
- 아이콘: FileQuestion
- 제목: "아직 사주분석 이력이 없습니다"
- 설명: "첫 사주분석을 시작해보세요"
- 버튼: "첫 검사 시작하기" → `/dashboard/new`

**검색 결과 없을 때**:
- 아이콘: Search
- 제목: "검색 결과가 없습니다"
- 설명: "다른 검색어로 시도해보세요"
- 버튼: "검색 초기화"

---

## 8. 상태 관리

### 8.1 서버 상태
- **초기 데이터**: Server Component에서 페칭
- **캐싱**: Next.js App Router 자동 캐싱
- **재검증**: revalidatePath 사용

### 8.2 클라이언트 상태

#### 8.2.1 검색 상태
```typescript
const [searchQuery, setSearchQuery] = useState('');
```

#### 8.2.2 페이지네이션 상태
```typescript
const [tests, setTests] = useState<SajuTestListItem[]>(initialTests);
const [offset, setOffset] = useState(10);
const [hasMore, setHasMore] = useState(initialTests.length === 10);
const [isLoading, setIsLoading] = useState(false);
```

### 8.3 URL 상태
- **현재 페이지**: 라우트 자체 (`/dashboard`)
- **쿼리 파라미터**: 사용 안함 (클라이언트 상태로 충분)

---

## 9. 레이아웃 개선

### 9.1 Protected Layout 수정

**위치**: `src/app/(protected)/layout.tsx`

**변경 사항**:
```typescript
export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // 구독 정보 조회
  const subscription = await getSubscription();

  return (
    <>
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar
          userEmail={subscription?.userEmail || ''}
          subscriptionStatus={subscription?.status || 'free'}
          testCount={subscription?.testCount || 0}
          nextBillingDate={subscription?.nextBillingDate || null}
        />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </>
  );
}
```

**주의사항**:
- 현재 layout은 Client Component이므로 Server Component로 변경 필요
- 또는 구독 정보를 props로 전달하는 별도 래퍼 컴포넌트 생성

### 9.2 반응형 레이아웃

#### 데스크톱 (1024px 이상)
```
┌─────────────────────────────────────┐
│         DashboardHeader             │
├──────────┬─────────────────────────┤
│          │                          │
│ Sidebar  │   Main Content          │
│ (w-64)   │   (flex-1)              │
│          │                          │
└──────────┴─────────────────────────┘
```

#### 모바일/태블릿 (1024px 미만)
```
┌─────────────────────────────────────┐
│  ☰  DashboardHeader                 │
├─────────────────────────────────────┤
│                                      │
│        Main Content (full)          │
│                                      │
└─────────────────────────────────────┘

Sheet (햄버거 메뉴 클릭 시)
```

---

## 10. 파일 구조 및 경로

### 10.1 신규 파일

```
src/
├── app/
│   └── (protected)/
│       ├── layout.tsx (수정 필요)
│       └── dashboard/
│           └── page.tsx (업데이트)
│
├── components/
│   └── layout/
│       └── dashboard-sidebar.tsx (신규)
│
└── features/
    ├── saju/
    │   ├── components/
    │   │   ├── search-bar.tsx (신규)
    │   │   ├── saju-test-card.tsx (신규)
    │   │   └── load-more-button.tsx (신규)
    │   └── actions/
    │       └── load-more-tests.ts (신규)
    │
    └── subscription/
        └── queries/
            └── get-subscription.ts (common-modules에서 구현)
```

### 10.2 기존 파일 (사용)

```
src/
├── features/
│   └── saju/
│       ├── types/
│       │   └── result.ts (기존)
│       └── queries/
│           └── get-saju-tests.ts (기존)
│
├── components/
│   ├── layout/
│   │   └── dashboard-header.tsx (기존)
│   └── ui/ (모두 기존)
│
└── lib/
    ├── supabase/ (기존)
    └── utils/ (기존)
```

---

## 11. 구현 단계

### Phase 1: 사이드바 구현 (1시간)

#### 11.1.1 구독 정보 조회 함수 (common-modules 의존)
- `getSubscription()` 구현 대기
- 임시로 Mock 데이터 사용 가능

#### 11.1.2 DashboardSidebar 컴포넌트
- 데스크톱 레이아웃
- 구독 정보 표시
- 네비게이션 링크

#### 11.1.3 모바일 Sheet
- 햄버거 메뉴 버튼
- Sheet 컴포넌트 활용
- 사이드바 내용 동일

#### 11.1.4 Protected Layout 수정
- Server Component로 변경
- 구독 정보 페칭
- 사이드바 통합

### Phase 2: 검색 기능 구현 (30분)

#### 11.2.1 SearchBar 컴포넌트
- Input 기반 UI
- 디바운스 로직
- 클리어 버튼

#### 11.2.2 클라이언트 필터링
- useState로 검색어 관리
- 필터링 로직 구현
- 검색 결과 없을 때 빈 상태

### Phase 3: 페이지네이션 구현 (40분)

#### 11.3.1 LoadMoreButton 컴포넌트
- 버튼 UI
- 로딩 상태
- hasMore 체크

#### 11.3.2 Server Action
- `loadMoreTests()` 함수 구현
- offset, limit 파라미터
- 에러 처리

#### 11.3.3 클라이언트 통합
- useState로 tests, offset 관리
- 버튼 클릭 시 추가 로드
- 기존 데이터에 append

### Phase 4: 이력 카드 구현 (30분)

#### 11.4.1 SajuTestCard 컴포넌트
- Card 기반 UI
- 정보 표시
- 클릭 이벤트

#### 11.4.2 그리드 레이아웃
- 반응형 그리드 (1/2/3열)
- 카드 간격

### Phase 5: 페이지 통합 및 스타일링 (30분)

#### 11.5.1 DashboardPage 업데이트
- 검색바 추가
- 페이지네이션 통합
- 레이아웃 조정

#### 11.5.2 반응형 스타일
- 모바일/태블릿/데스크톱
- 사이드바 토글

#### 11.5.3 접근성
- ARIA 라벨
- 키보드 네비게이션

### Phase 6: 테스트 및 검증 (30분)

#### 11.6.1 기능 테스트
- 검색 동작
- 페이지네이션
- 사이드바 토글

#### 11.6.2 반응형 테스트
- 모바일/태블릿/데스크톱
- 사이드바 반응형

#### 11.6.3 에러 케이스
- 데이터 없음
- 검색 결과 없음
- 로딩 실패

---

## 12. 코드 예시

### 12.1 DashboardSidebar

```typescript
// src/components/layout/dashboard-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Home, PlusCircle, CreditCard } from 'lucide-react';

type DashboardSidebarProps = {
  userEmail: string;
  subscriptionStatus: 'free' | 'pro' | 'cancelled' | 'payment_failed';
  testCount: number;
  nextBillingDate: string | null;
};

const navItems = [
  { label: '대시보드', href: '/dashboard', icon: Home },
  { label: '새 검사', href: '/dashboard/new', icon: PlusCircle },
  { label: '구독 관리', href: '/subscription', icon: CreditCard },
];

const subscriptionLabels = {
  free: '무료 요금제',
  pro: 'Pro 요금제',
  cancelled: 'Pro (취소 예약)',
  payment_failed: '결제 실패',
};

const subscriptionVariants = {
  free: 'secondary',
  pro: 'default',
  cancelled: 'outline',
  payment_failed: 'destructive',
} as const;

export function DashboardSidebar({
  userEmail,
  subscriptionStatus,
  testCount,
  nextBillingDate,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/10 p-6 hidden lg:block">
      {/* 사용자 정보 */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
      </div>

      <Separator className="mb-6" />

      {/* 구독 정보 */}
      <div className="mb-6 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">요금제</p>
          <Badge variant={subscriptionVariants[subscriptionStatus]}>
            {subscriptionLabels[subscriptionStatus]}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">잔여 검사 횟수</p>
          <p className="text-2xl font-bold">{testCount}회</p>
        </div>

        {nextBillingDate && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {subscriptionStatus === 'cancelled' ? '해지 예정일' : '다음 결제일'}
            </p>
            <p className="text-sm">{formatDate(nextBillingDate, 'yyyy-MM-dd')}</p>
          </div>
        )}

        {subscriptionStatus === 'payment_failed' && (
          <p className="text-xs text-destructive">
            결제 실패. 구독 관리 페이지에서 확인하세요.
          </p>
        )}
      </div>

      <Separator className="mb-6" />

      {/* 네비게이션 */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### 12.2 SearchBar

```typescript
// src/features/saju/components/search-bar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

export function SearchBar({ onSearch, placeholder = '검사자 이름으로 검색...' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### 12.3 DashboardPage (업데이트)

```typescript
// src/app/(protected)/dashboard/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSajuTests } from '@/features/saju/queries/get-saju-tests';
import { DashboardContent } from '@/features/saju/components/dashboard-content';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '내 사주분석 이력 | Vibe Fortune',
  description: '과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요',
};

export default async function DashboardPage() {
  const tests = await getSajuTests();

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">내 사주분석 이력</h1>
          <p className="text-muted-foreground mt-1">
            과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button>새 검사하기</Button>
        </Link>
      </div>

      {/* 메인 컨텐츠 (Client Component) */}
      <DashboardContent initialTests={tests} />
    </div>
  );
}
```

### 12.4 DashboardContent (Client Component)

```typescript
// src/features/saju/components/dashboard-content.tsx
'use client';

import { useState, useCallback } from 'react';
import { SajuTestCard } from './saju-test-card';
import { SearchBar } from './search-bar';
import { LoadMoreButton } from './load-more-button';
import { loadMoreTests } from '@/features/saju/actions/load-more-tests';
import { FileQuestion, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { SajuTestListItem } from '@/features/saju/types/result';

type DashboardContentProps = {
  initialTests: SajuTestListItem[];
};

export function DashboardContent({ initialTests }: DashboardContentProps) {
  const [tests, setTests] = useState<SajuTestListItem[]>(initialTests);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(10);
  const [hasMore, setHasMore] = useState(initialTests.length === 10);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 필터링
  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 검색 핸들러
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 더보기 핸들러
  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      const result = await loadMoreTests(offset);
      if (result.success && result.data) {
        setTests((prev) => [...prev, ...result.data!]);
        setOffset((prev) => prev + 10);
        setHasMore(result.hasMore || false);
      }
    } catch (error) {
      console.error('더보기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 빈 상태 - 이력 없음
  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">아직 사주분석 이력이 없습니다</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          첫 사주분석을 시작해보세요
        </p>
        <Link href="/dashboard/new">
          <Button>첫 검사 시작하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색바 */}
      <SearchBar onSearch={handleSearch} />

      {/* 검색 결과 없음 */}
      {searchQuery && filteredTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            다른 검색어로 시도해보세요
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            검색 초기화
          </Button>
        </div>
      ) : (
        <>
          {/* 이력 카드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <SajuTestCard key={test.id} test={test} />
            ))}
          </div>

          {/* 더보기 버튼 (검색 중이 아닐 때만) */}
          {!searchQuery && hasMore && (
            <div className="flex justify-center">
              <LoadMoreButton
                onLoadMore={handleLoadMore}
                isLoading={isLoading}
                hasMore={hasMore}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 13. 데이터 페칭 전략

### 13.1 서버 컴포넌트 우선

#### 13.1.1 초기 로드
- Server Component에서 `getSajuTests()` 호출
- 최대 10개 조회
- Props로 Client Component에 전달

#### 13.1.2 캐싱
- Next.js App Router 자동 캐싱 활용
- `revalidatePath('/dashboard')` 호출 시 재검증

### 13.2 클라이언트 측 추가 로드

#### 13.2.1 Server Action
- `loadMoreTests()` 함수
- offset, limit 파라미터
- 에러 처리

#### 13.2.2 optimistic update
- 필요 시 적용 (초기 버전에서는 제외)

### 13.3 캐싱 전략

#### 13.3.1 Server Component 캐싱
- Next.js 기본 캐싱 (5분)
- revalidatePath로 수동 재검증

#### 13.3.2 Client Component 상태
- useState로 로컬 상태 관리
- 검색/필터링은 메모리에서만

---

## 14. 반응형 디자인

### 14.1 브레이크포인트

| 디바이스 | 너비 | 사이드바 | 그리드 |
|---------|------|---------|-------|
| 모바일 | < 768px | Sheet (햄버거) | 1열 |
| 태블릿 | 768px ~ 1023px | Sheet (햅버거) | 2열 |
| 데스크톱 | ≥ 1024px | 고정 좌측 | 3열 |

### 14.2 사이드바 반응형

#### 데스크톱
- 고정 좌측 사이드바 (w-64)
- 항상 표시

#### 모바일/태블릿
- Sheet 컴포넌트
- 햄버거 메뉴로 토글
- 헤더에 햄버거 버튼 추가

### 14.3 그리드 레이아웃

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 15. 성능 최적화

### 15.1 서버 컴포넌트 활용
- 초기 데이터 페칭은 서버에서만
- 클라이언트 번들 크기 최소화

### 15.2 Supabase 쿼리 최적화
- 필요한 컬럼만 SELECT
- 인덱스 활용 (user_id + created_at)
- LIMIT 적용

### 15.3 검색 디바운스
- 불필요한 렌더링 방지
- 300ms 지연

### 15.4 페이지네이션
- 초기 10개만 로드
- 필요 시 추가 로드

---

## 16. 접근성

### 16.1 키보드 네비게이션
- Tab으로 모든 요소 접근
- Enter/Space로 활성화
- ESC로 Sheet 닫기

### 16.2 ARIA 속성
- 카드: `role="button"`, `aria-label`
- 검색바: `aria-label="검사자 이름 검색"`
- 더보기 버튼: `aria-busy` (로딩 시)

### 16.3 시맨틱 HTML
- `<nav>`, `<aside>`, `<main>`
- 적절한 heading 레벨
- `<button>` vs `<a>` 구분

---

## 17. 주의사항

### 17.1 common-modules 의존성
- `getSubscription()` 함수 구현 필요
- common-modules 문서 참고

### 17.2 Protected Layout 수정
- 현재 Client Component
- Server Component로 변경 필요
- 또는 별도 래퍼 컴포넌트 생성

### 17.3 PRD 준수
- 명시된 기능만 구현
- 제외 사항 구현 금지

---

## 18. 테스트 체크리스트

### 18.1 기능 테스트
- [ ] 로그인 상태에서 대시보드 접근
- [ ] 비로그인 시 리다이렉트
- [ ] 사이드바 구독 정보 표시
- [ ] 검색 기능 동작
- [ ] 페이지네이션 동작
- [ ] 카드 클릭 시 상세 페이지 이동
- [ ] 빈 상태 화면 (이력 없음/검색 결과 없음)

### 18.2 반응형 테스트
- [ ] 모바일 (320px)
- [ ] 태블릿 (768px)
- [ ] 데스크톱 (1024px 이상)
- [ ] 사이드바 Sheet 동작 (모바일)

### 18.3 접근성 테스트
- [ ] 키보드 네비게이션
- [ ] ARIA 라벨
- [ ] 스크린 리더 호환성

### 18.4 성능 테스트
- [ ] 페이지 로드 3초 이내
- [ ] 검색 디바운스 동작
- [ ] 페이지네이션 로딩 상태

---

## 19. 예상 구현 시간

| 단계 | 작업 내용 | 예상 시간 |
|------|----------|----------|
| Phase 1 | 사이드바 구현 | 1시간 |
| Phase 2 | 검색 기능 구현 | 30분 |
| Phase 3 | 페이지네이션 구현 | 40분 |
| Phase 4 | 이력 카드 구현 | 30분 |
| Phase 5 | 페이지 통합 및 스타일링 | 30분 |
| Phase 6 | 테스트 및 검증 | 30분 |
| **총 예상 시간** | | **3시간 40분** |

---

## 20. 관련 문서

- **PRD**: `/docs/prd.md` (섹션 3.2.2 대시보드)
- **Userflow**: `/docs/userflow.md` (섹션 4. 사주분석 이력 조회 플로우)
- **Database**: `/docs/database.md` (analyses, users, subscriptions 테이블)
- **Common Modules**: `/docs/common-modules.md` (구독 관리 관련)

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
| 2.0 | 2025-10-28 | Claude Code | 구독 기능 추가, 사이드바 통합, 검색/페이지네이션 추가 |
