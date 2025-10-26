# 대시보드 페이지 구현 계획

## 문서 개요

본 문서는 대시보드 페이지(`/dashboard`)의 구체적인 구현 계획을 정의합니다.

**작성 원칙:**
- PRD, userflow, database, common-modules 문서에 명시된 내용만 구현
- 오버엔지니어링 금지
- 기존 코드베이스와 충돌하지 않도록 설계

---

## 1. 페이지 개요 및 목적

### 1.1 목적
사용자가 과거에 수행한 사주분석 이력을 조회하고, 새로운 사주분석을 시작할 수 있는 중앙 관리 페이지

### 1.2 주요 기능
- 사주분석 이력 목록 조회 (최신순 정렬)
- 이력 카드 클릭을 통한 상세 페이지 이동
- 새 검사하기 버튼을 통한 새 분석 시작
- 빈 상태 처리 (이력 없을 때)

### 1.3 제외 사항
- 이력 삭제 기능
- 이력 검색 및 필터링
- 이력 수정 기능
- 페이지네이션 (초기 버전에서는 최대 10개만 표시)

---

## 2. 라우트 및 접근 권한

### 2.1 라우트 정보
- **경로**: `/dashboard`
- **레이아웃**: `(protected)` 레이아웃 그룹 사용
- **파일 위치**: `src/app/(protected)/dashboard/page.tsx`

### 2.2 접근 권한
- **필수 조건**: Clerk 로그인 필요
- **미들웨어**: Clerk Middleware가 자동으로 인증 체크
- **비로그인 시**: Clerk 로그인 페이지로 자동 리다이렉트
- **returnUrl**: 로그인 후 대시보드로 복귀

### 2.3 보안
- RLS (Row Level Security): Supabase에서 본인 데이터만 조회 가능
- 서버 컴포넌트: 데이터 페칭은 서버에서만 수행
- 클라이언트 노출 최소화: 민감 정보 없음

---

## 3. 사용할 공통 모듈 목록

### 3.1 이미 구현된 모듈

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

#### 유틸리티
- `src/lib/utils/date.ts`: 날짜 포맷팅 함수
- `src/lib/utils.ts`: cn (className 유틸리티)

### 3.2 추가 구현 필요 여부
모든 필수 공통 모듈이 이미 구현되어 있으므로 추가 구현 불필요

---

## 4. 페이지 컴포넌트 구조

### 4.1 컴포넌트 계층 구조

```
DashboardPage (Server Component)
├── DashboardHeader (Client Component, 공통)
└── main
    ├── PageHeader
    │   ├── h1: "내 사주분석 이력"
    │   └── Button: "새 검사하기"
    │
    ├── SajuTestList (조건부 렌더링)
    │   ├── (이력 있을 때) SajuTestCard[] (Client Component)
    │   └── (이력 없을 때) EmptyState (공통)
    └── LoadingState (Suspense fallback)
```

### 4.2 Server Component vs Client Component

#### Server Components
- `DashboardPage`: 메인 페이지 컴포넌트
  - 데이터 페칭 (`getSajuTests()`)
  - 조건부 렌더링 (이력 유무)

#### Client Components
- `DashboardHeader`: 네비게이션, UserButton (공통 모듈)
- `SajuTestCard`: 이력 카드 (클릭 이벤트 처리)
- `EmptyState`: 빈 상태 화면 (버튼 클릭 이벤트, 공통 모듈)

### 4.3 신규 구현 컴포넌트

#### SajuTestCard
이력 카드 컴포넌트 (Client Component)

**위치**: `src/features/saju/components/saju-test-card.tsx`

**Props**:
```typescript
type SajuTestCardProps = {
  test: SajuTestListItem;
};
```

**역할**:
- 분석 대상 정보 표시 (이름, 생년월일, 성별, 날짜)
- 클릭 시 상세 페이지로 이동
- 호버 효과

**구현 세부사항**:
- Card 컴포넌트 기반
- useRouter 훅 사용 (Client Component)
- 날짜 포맷팅: formatDate 유틸리티 사용
- 성별 표시: Badge 컴포넌트 사용

---

## 5. 구현할 기능 목록

### 5.1 데이터 로딩

#### 5.1.1 사주분석 목록 조회
- **함수**: `getSajuTests()` (이미 구현됨)
- **위치**: `src/features/saju/queries/get-saju-tests.ts`
- **동작**:
  1. Supabase Server Client 생성
  2. 현재 사용자 ID 추출 (Clerk)
  3. saju_tests 테이블 쿼리
  4. 최신순 정렬 (created_at DESC)
  5. 최대 10개 제한
  6. SajuTestListItem[] 반환

#### 5.1.2 로딩 상태 처리
- **방법**: React Suspense 활용
- **Fallback UI**: Spinner 또는 Skeleton 표시
- **에러 바운더리**: Next.js Error Boundary 사용 (필요 시)

### 5.2 이력 카드 렌더링

#### 5.2.1 카드 레이아웃
- **그리드 레이아웃**:
  - 모바일: 1열
  - 태블릿: 2열
  - 데스크톱: 3열
- **카드 정보**:
  - 분석 대상 이름 (Bold, 상단)
  - 생년월일 (YYYY-MM-DD 형식)
  - 성별 (Badge: 남성/여성)
  - 분석 날짜 (상대적 또는 절대 시간)

#### 5.2.2 인터랙션
- **호버 효과**: 배경색 변경, 그림자 증가
- **클릭 이벤트**: router.push(`/dashboard/results/${test.id}`)
- **키보드 네비게이션**: Tab 키로 포커스, Enter 키로 선택

### 5.3 빈 상태 처리

#### 5.3.1 조건
- 조회된 이력이 0건인 경우

#### 5.3.2 UI
- **컴포넌트**: EmptyState (공통 모듈)
- **메시지**: "아직 사주분석 이력이 없습니다"
- **설명**: "첫 사주분석을 시작해보세요"
- **버튼**: "첫 검사 시작하기"
- **버튼 동작**: `/dashboard/new`로 이동

### 5.4 새 검사하기 버튼

#### 5.4.1 위치
- 페이지 제목 우측 상단

#### 5.4.2 동작
- 클릭 시 `/dashboard/new`로 이동
- Primary 버튼 스타일

---

## 6. 상태 관리

### 6.1 서버 상태
- **데이터 페칭**: Server Component에서 직접 수행
- **캐싱**: Next.js App Router 자동 캐싱 활용
- **재검증**: 필요 시 revalidatePath 사용

### 6.2 클라이언트 상태
- **최소화 원칙**: 서버 컴포넌트 우선 사용
- **필요한 경우만**: 클릭 이벤트, 호버 상태 등
- **상태 관리 라이브러리**: 불필요 (단순 페이지)

### 6.3 URL 상태
- **현재 페이지**: 라우트 자체 (`/dashboard`)
- **쿼리 파라미터**: 사용 안함 (초기 버전)

---

## 7. API 호출

### 7.1 사주분석 목록 조회

#### 7.1.1 함수 시그니처
```typescript
// src/features/saju/queries/get-saju-tests.ts
export async function getSajuTests(limit = 10): Promise<SajuTestListItem[]>
```

#### 7.1.2 호출 위치
- Server Component (`DashboardPage`)
- 페이지 렌더링 시 자동 실행

#### 7.1.3 에러 처리
- try-catch 블록에서 에러 캐치
- 에러 발생 시 빈 배열 반환
- 콘솔 에러 로깅

#### 7.1.4 Supabase 쿼리
```typescript
const { data, error } = await supabase
  .from('saju_tests')
  .select('id, name, birth_date, gender, result, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(limit);
```

#### 7.1.5 데이터 변환
```typescript
return data.map((test) => ({
  id: test.id,
  name: test.name,
  birthDate: test.birth_date,
  gender: test.gender as 'male' | 'female',
  createdAt: test.created_at,
  preview: test.result.slice(0, 100) + '...',
}));
```

---

## 8. 파일 구조 및 경로

### 8.1 페이지 파일
```
src/app/(protected)/dashboard/
├── page.tsx              # 대시보드 메인 페이지 (Server Component)
└── layout.tsx            # (이미 존재, 공통 레이아웃)
```

### 8.2 신규 컴포넌트
```
src/features/saju/components/
└── saju-test-card.tsx    # 이력 카드 컴포넌트 (Client Component)
```

### 8.3 기존 모듈 (사용)
```
src/features/saju/
├── types/
│   └── result.ts         # SajuTestListItem 타입 (이미 구현)
└── queries/
    └── get-saju-tests.ts # 목록 조회 함수 (이미 구현)

src/components/
├── layout/
│   └── dashboard-header.tsx  # 헤더 (이미 구현)
└── ui/
    ├── card.tsx          # Card (이미 구현)
    ├── button.tsx        # Button (이미 구현)
    ├── badge.tsx         # Badge (이미 구현)
    ├── empty-state.tsx   # EmptyState (이미 구현)
    └── spinner.tsx       # Spinner (이미 구현)

src/lib/
├── supabase/
│   ├── types.ts          # Database 타입 (이미 구현)
│   └── server-client.ts  # Server Client (이미 구현)
└── utils/
    └── date.ts           # 날짜 포맷팅 (이미 구현)
```

---

## 9. 구현 단계

### Phase 1: 페이지 기본 구조 (30분)

#### 9.1.1 DashboardPage 컴포넌트 생성
- `src/app/(protected)/dashboard/page.tsx` 파일 생성
- Server Component로 구현
- 메타데이터 설정 (title, description)

#### 9.1.2 데이터 페칭 로직 추가
- `getSajuTests()` 함수 호출
- 에러 처리 (try-catch)
- 조건부 렌더링 (이력 유무)

#### 9.1.3 기본 레이아웃 구성
- 페이지 헤더 (제목 + 새 검사하기 버튼)
- 메인 컨텐츠 영역
- 컨테이너 스타일링

### Phase 2: 이력 카드 컴포넌트 (30분)

#### 9.2.1 SajuTestCard 컴포넌트 생성
- `src/features/saju/components/saju-test-card.tsx` 파일 생성
- Client Component 선언 (`'use client'`)
- Props 타입 정의

#### 9.2.2 카드 UI 구현
- Card 컴포넌트 기반 레이아웃
- 정보 표시 (이름, 생년월일, 성별, 날짜)
- Badge로 성별 표시
- 날짜 포맷팅 (formatDate 유틸리티)

#### 9.2.3 인터랙션 구현
- useRouter 훅 사용
- onClick 이벤트로 상세 페이지 이동
- 호버 스타일 (Tailwind hover: 클래스)
- 키보드 접근성 (tabIndex, onKeyDown)

### Phase 3: 빈 상태 및 로딩 처리 (20분)

#### 9.3.1 빈 상태 렌더링
- EmptyState 컴포넌트 사용
- 조건부 렌더링 (이력 길이 === 0)
- "첫 검사 시작하기" 버튼 동작

#### 9.3.2 로딩 상태
- Suspense 적용 (필요 시)
- Spinner 또는 Skeleton fallback

#### 9.3.3 에러 처리
- Error Boundary (Next.js 자동)
- 에러 메시지 표시

### Phase 4: 스타일링 및 반응형 (20분)

#### 9.4.1 그리드 레이아웃
- Tailwind grid 클래스
- 반응형 브레이크포인트
  - sm: 1열
  - md: 2열
  - lg: 3열

#### 9.4.2 간격 및 패딩
- 카드 간 간격 (gap)
- 컨테이너 패딩
- 페이지 여백

#### 9.4.3 호버 및 포커스 효과
- 카드 호버: 배경색 변경, 그림자 증가
- 포커스: 아웃라인 표시
- 트랜지션 애니메이션

### Phase 5: 테스트 및 검증 (30분)

#### 9.5.1 기능 테스트
- 로그인 상태 확인
- 이력 목록 조회 (있을 때/없을 때)
- 카드 클릭 동작
- 새 검사하기 버튼 동작

#### 9.5.2 접근성 테스트
- 키보드 네비게이션
- 스크린 리더 (ARIA 라벨)
- 포커스 표시

#### 9.5.3 반응형 테스트
- 모바일 (320px)
- 태블릿 (768px)
- 데스크톱 (1024px 이상)

#### 9.5.4 에러 케이스 테스트
- 비로그인 상태 (미들웨어 리다이렉트 확인)
- 데이터베이스 연결 실패 (에러 처리 확인)
- 빈 상태 (EmptyState 표시 확인)

---

## 10. 주의사항

### 10.1 기존 코드베이스 충돌 방지

#### 10.1.1 Protected 레이아웃 활용
- `src/app/(protected)/layout.tsx` 이미 존재
- DashboardHeader는 레이아웃에서 렌더링
- 페이지에서는 메인 컨텐츠만 구현

#### 10.1.2 공통 모듈 사용
- 이미 구현된 모듈 최대한 활용
- 중복 구현 금지
- 타입 정의 재사용

### 10.2 PRD 준수

#### 10.2.1 포함 기능만 구현
- 이력 조회 (최대 10개)
- 카드 클릭 (상세 페이지 이동)
- 새 검사하기 버튼
- 빈 상태 처리

#### 10.2.2 제외 사항
- 이력 삭제 기능
- 이력 검색
- 이력 필터링
- 페이지네이션 (초기 버전)

### 10.3 성능 최적화

#### 10.3.1 서버 컴포넌트 우선
- 데이터 페칭은 서버에서만
- 클라이언트 컴포넌트 최소화
- 번들 크기 감소

#### 10.3.2 Next.js App Router 활용
- 자동 캐싱 활용
- Streaming (Suspense)
- Code Splitting

#### 10.3.3 Supabase 쿼리 최적화
- 필요한 컬럼만 SELECT
- 인덱스 활용 (user_id + created_at)
- LIMIT 적용 (10개)

### 10.4 보안

#### 10.4.1 RLS 정책
- Supabase RLS로 본인 데이터만 조회
- 서버 측 검증 (user_id 일치)
- 클라이언트 노출 최소화

#### 10.4.2 인증
- Clerk Middleware 자동 처리
- 비로그인 시 자동 리다이렉트
- JWT 기반 인증

#### 10.4.3 데이터 검증
- TypeScript 타입 체크
- Supabase RLS 강제 적용
- 서버 컴포넌트 우선

### 10.5 접근성

#### 10.5.1 키보드 네비게이션
- Tab으로 카드 이동
- Enter로 카드 선택
- 명확한 포커스 표시

#### 10.5.2 ARIA 속성
- 카드에 aria-label 추가
- 로딩 상태 aria-busy
- 에러 메시지 aria-live

#### 10.5.3 시맨틱 HTML
- 적절한 heading 레벨 (h1, h2)
- nav, main, section 사용
- button vs link 구분

### 10.6 에러 처리

#### 10.6.1 데이터 로딩 실패
- try-catch로 에러 캐치
- 빈 배열 반환
- 콘솔 에러 로깅

#### 10.6.2 네트워크 에러
- Suspense로 로딩 상태 처리
- Error Boundary로 에러 캐치
- 사용자 친화적 메시지

#### 10.6.3 세션 만료
- Clerk Middleware 자동 처리
- 로그인 페이지로 리다이렉트
- returnUrl 저장

---

## 11. 코드 예시

### 11.1 DashboardPage (Server Component)

```typescript
// src/app/(protected)/dashboard/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSajuTests } from '@/features/saju/queries/get-saju-tests';
import { SajuTestCard } from '@/features/saju/components/saju-test-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: '내 사주분석 이력 | Vibe Fortune',
  description: '과거 사주분석 결과를 확인하고 새로운 분석을 시작하세요',
};

export default async function DashboardPage() {
  const tests = await getSajuTests();

  return (
    <div className="container py-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">내 사주분석 이력</h1>
        <Link href="/dashboard/new">
          <Button>새 검사하기</Button>
        </Link>
      </div>

      {/* 메인 컨텐츠 */}
      {tests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <SajuTestCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="아직 사주분석 이력이 없습니다"
          description="첫 사주분석을 시작해보세요"
          actionLabel="첫 검사 시작하기"
          onAction={() => {
            // EmptyState는 Client Component이므로 버튼은 Link로 대체
          }}
        />
      )}
    </div>
  );
}
```

### 11.2 SajuTestCard (Client Component)

```typescript
// src/features/saju/components/saju-test-card.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import type { SajuTestListItem } from '@/features/saju/types/result';

type SajuTestCardProps = {
  test: SajuTestListItem;
};

export function SajuTestCard({ test }: SajuTestCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/results/${test.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:bg-accent/50"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${test.name}님의 사주분석 결과, ${formatDate(test.createdAt)}에 생성됨`}
    >
      <CardHeader>
        <CardTitle>{test.name}</CardTitle>
        <CardDescription>
          {formatDate(test.birthDate, 'yyyy-MM-dd')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={test.gender === 'male' ? 'default' : 'secondary'}>
            {test.gender === 'male' ? '남성' : '여성'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDate(test.createdAt, 'yyyy년 MM월 dd일')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 11.3 EmptyState 개선 (버튼 대신 Link 사용)

대시보드에서는 EmptyState 대신 커스텀 빈 상태 UI를 직접 구현하는 것이 더 나을 수 있습니다:

```typescript
// DashboardPage 내부
{tests.length === 0 && (
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
)}
```

---

## 12. 테스트 체크리스트

### 12.1 기능 테스트
- [ ] 로그인 상태에서 대시보드 접근 가능
- [ ] 비로그인 시 Clerk 로그인 페이지로 리다이렉트
- [ ] 이력이 있을 때 카드 목록 표시
- [ ] 이력이 없을 때 빈 상태 화면 표시
- [ ] 카드 클릭 시 상세 페이지로 이동
- [ ] 새 검사하기 버튼 클릭 시 새 검사 페이지로 이동
- [ ] 최신순 정렬 확인

### 12.2 UI/UX 테스트
- [ ] 그리드 레이아웃 (모바일 1열, 태블릿 2열, 데스크톱 3열)
- [ ] 카드 호버 효과 동작
- [ ] 카드 포커스 표시 (키보드)
- [ ] 날짜 포맷팅 정확성
- [ ] Badge 색상 (남성/여성 구분)

### 12.3 접근성 테스트
- [ ] Tab 키로 카드 포커스 이동
- [ ] Enter/Space 키로 카드 선택
- [ ] ARIA 라벨 존재 (카드)
- [ ] 스크린 리더 호환성

### 12.4 반응형 테스트
- [ ] 320px (모바일 최소 너비)
- [ ] 768px (태블릿)
- [ ] 1024px 이상 (데스크톱)
- [ ] 터치 디바이스 호버 대체

### 12.5 성능 테스트
- [ ] 페이지 로드 시간 3초 이내
- [ ] 데이터 조회 시간 1초 이내
- [ ] 카드 클릭 즉시 반응

### 12.6 보안 테스트
- [ ] RLS로 본인 데이터만 조회
- [ ] 다른 사용자 데이터 접근 불가
- [ ] 서버 컴포넌트에서 데이터 페칭

---

## 13. 예상 구현 시간

| 단계 | 작업 내용 | 예상 시간 |
|------|----------|----------|
| Phase 1 | 페이지 기본 구조 | 30분 |
| Phase 2 | 이력 카드 컴포넌트 | 30분 |
| Phase 3 | 빈 상태 및 로딩 처리 | 20분 |
| Phase 4 | 스타일링 및 반응형 | 20분 |
| Phase 5 | 테스트 및 검증 | 30분 |
| **총 예상 시간** | | **2시간 10분** |

---

## 14. 관련 문서

- **PRD**: `/docs/prd.md` (섹션 3.2.2 대시보드)
- **Userflow**: `/docs/userflow.md` (섹션 4. 사주분석 이력 조회 플로우)
- **Database**: `/docs/database.md` (saju_tests 테이블)
- **Common Modules**: `/docs/common-modules.md`
- **Usecase**: `/docs/usecases/3-analysis-history/spec.md`

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
