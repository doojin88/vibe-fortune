# 사주분석 상세 페이지 구현 계획

## 1. 페이지 개요 및 목적

### 1.1 목적
사용자가 과거에 생성한 사주분석 결과를 상세하게 조회하고, 분석 결과를 활용할 수 있도록 한다.

### 1.2 핵심 기능
- 특정 사주분석 결과의 상세 정보 조회
- 분석 대상 정보 표시 (이름, 생년월일, 출생시간, 성별, 분석 날짜)
- 마크다운 형식의 AI 분석 결과 렌더링
- **Pro/Free 분석 결과 차이 표현** (모델 정보 표시)
- 분석 결과 클립보드 복사 기능
- 다른 페이지로의 네비게이션 (목록, 새 검사)

### 1.3 제외 사항
- 분석 결과 수정 기능
- 분석 결과 삭제 기능
- PDF 다운로드 기능
- 소셜 공유 기능

---

## 2. 라우트 및 접근 권한

### 2.1 라우트
- **경로**: `/dashboard/results/[id]`
- **타입**: 동적 라우트 (Dynamic Route)
- **파라미터**: `id` (UUID 형식의 사주분석 ID)

### 2.2 접근 권한
- **로그인 필요**: 예
- **본인만 접근**: 예 (Supabase RLS 정책으로 보장)
- **미들웨어 보호**: Clerk middleware를 통해 인증 상태 확인

### 2.3 권한 검증 플로우
1. Clerk 미들웨어가 세션 확인
2. 비로그인 시 로그인 페이지로 리다이렉트
3. Supabase RLS 정책이 user_id 일치 여부 확인
4. 권한 없으면 null 반환 → 404 페이지 렌더링

### 2.4 보안 요구사항
- **RLS 기반 권한 검증**: 서버 컴포넌트와 RLS 정책으로 이중 검증
- **타인의 분석 접근 시**: 404 페이지 표시 (데이터 존재 여부 노출 방지)
- **XSS 방지**: ReactMarkdown 자동 sanitize 처리
- **존재하지 않는 분석**: notFound() 처리

---

## 3. 데이터 요구사항

### 3.1 데이터베이스 스키마 (analyses 테이블)
```typescript
type Analysis = {
  id: string;              // UUID
  user_id: string;         // text (Clerk user ID)
  name: string;            // 분석 대상 이름
  birth_date: string;      // 생년월일 (YYYY-MM-DD)
  birth_time: string | null; // 출생시간 (HH:mm) 또는 null
  gender: 'male' | 'female'; // 성별
  analysis_result: string; // AI 분석 결과 (마크다운)
  model_used: 'flash' | 'pro'; // 사용된 모델 (신규 필드)
  created_at: string;      // 분석 생성일시
};
```

### 3.2 데이터 페칭 전략
- **Server Component**: 페이지 로드 시 서버에서 데이터 조회
- **RLS 정책**: Supabase RLS가 본인 분석만 반환
- **에러 처리**: null 반환 시 404 페이지
- **캐싱**: Next.js 자동 캐싱 (revalidate 미설정 시 무제한)

### 3.3 데이터 조회 함수 (기존 구현)
```typescript
// src/features/saju/queries/get-saju-test.ts
export async function getSajuTest(id: string): Promise<SajuTestResult | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId) // 본인 분석만 조회
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    birthDate: data.birth_date,
    birthTime: data.birth_time,
    gender: data.gender as 'male' | 'female',
    result: data.analysis_result,
    modelUsed: data.model_used, // 추가 필요
    createdAt: data.created_at,
  };
}
```

### 3.4 타입 정의 업데이트 필요
```typescript
// src/features/saju/types/result.ts (업데이트 필요)
export type SajuTestResult = {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  gender: 'male' | 'female';
  result: string;
  modelUsed: 'flash' | 'pro'; // 추가 필요
  createdAt: string;
};
```

---

## 4. 사용할 공통 모듈 목록

### 4.1 데이터 레이어
- **`@/features/saju/queries/get-saju-test.ts`**: 사주분석 상세 조회 함수 (업데이트 필요)
- **`@/features/saju/types/result.ts`**: `SajuTestResult` 타입 (업데이트 필요)
- **`@/lib/supabase/server-client.ts`**: Supabase 서버 클라이언트 (완료)

### 4.2 UI 컴포넌트
- **`@/components/markdown-renderer.tsx`**: 마크다운 렌더러 (완료)
- **`@/components/layout/dashboard-header.tsx`**: 대시보드 헤더 (완료)
- **`@/components/ui/card.tsx`**: 분석 대상 정보 카드 (shadcn-ui)
- **`@/components/ui/button.tsx`**: 액션 버튼 (shadcn-ui)
- **`@/components/ui/badge.tsx`**: 성별/모델 뱃지 (shadcn-ui)

### 4.3 유틸리티
- **`@/lib/utils/clipboard.ts`**: 클립보드 복사 함수 (완료)
- **`@/lib/utils/date.ts`**: 날짜 포맷팅 함수 (완료)
- **`@/hooks/use-toast.ts`**: 토스트 메시지 훅 (완료)

### 4.4 아이콘
- **lucide-react**: `Copy`, `Check`, `ArrowLeft`, `Plus`, `Sparkles` (Pro 표시) 아이콘

---

## 5. 페이지 컴포넌트 구조

### 5.1 페이지 구조
```
/dashboard/results/[id]/
└── page.tsx (Server Component)
    ├── getSajuTest() 호출로 데이터 조회
    ├── 데이터 없으면 notFound() 호출
    └── ResultDetailClient 컴포넌트로 전달
```

### 5.2 컴포넌트 계층
```
page.tsx (Server Component)
└── ResultDetailClient (Client Component)
    ├── DashboardHeader
    ├── AnalysisInfoCard
    │   ├── Card
    │   ├── CardHeader
    │   ├── CardTitle
    │   └── CardContent
    │       ├── 이름
    │       ├── 생년월일
    │       ├── 출생시간
    │       ├── 성별 (Badge)
    │       ├── 분석 날짜
    │       └── 모델 정보 (Badge) - 신규
    ├── AnalysisResultSection
    │   ├── Pro/Free 안내 메시지 (조건부) - 신규
    │   ├── CopyButton (상단 우측)
    │   └── MarkdownRenderer
    └── NavigationButtons
        ├── Button (목록으로)
        └── Button (새 검사하기)
```

### 5.3 컴포넌트 분리 이유
- **Server Component (page.tsx)**: 데이터 페칭, SEO 최적화
- **Client Component (ResultDetailClient)**: 클립보드 복사, 네비게이션 등 클라이언트 인터랙션
- **AnalysisInfoCard**: 재사용 가능한 정보 표시 카드
- **AnalysisResultSection**: 결과 렌더링 및 복사 기능
- **NavigationButtons**: 네비게이션 버튼 그룹

---

## 6. 구현할 기능 목록

### 6.1 데이터 조회 (Server Component)
- [x] 공통 모듈 사용: `getSajuTest(id)` 함수 활용
- [ ] **modelUsed 필드 추가** (타입 및 쿼리 업데이트)
- [ ] 동적 라우트 파라미터 추출
- [ ] 데이터 존재 여부 확인
- [ ] 404 처리 (notFound() 호출)

### 6.2 분석 대상 정보 표시
- [ ] 이름 표시
- [ ] 생년월일 포맷팅 (`formatDate`)
- [ ] 출생시간 포맷팅 (있을 경우 `HH시 mm분`, 없으면 `미상`)
- [ ] 성별 뱃지 (남성/여성)
- [ ] 분석 날짜 포맷팅 (`formatDateTime`)
- [ ] **모델 정보 뱃지 표시** (flash: "기본 분석", pro: "Pro 고급 분석")

### 6.3 Pro/Free 분석 결과 차이 표현
- [ ] **모델 뱃지 표시**: flash vs pro
- [ ] **Pro 분석 안내 메시지**: "이 분석은 Pro 구독으로 생성된 고급 분석입니다. 직업운, 사업운, 월별 운세가 포함되어 있습니다."
- [ ] **Free 분석 안내 메시지**: "기본 분석 결과입니다. Pro 구독 시 더욱 상세한 분석을 받을 수 있습니다."
- [ ] **조건부 렌더링**: modelUsed 필드 기반

### 6.4 마크다운 결과 렌더링
- [x] 공통 모듈 사용: `MarkdownRenderer` 컴포넌트 활용
- [ ] prose 스타일 적용 (tailwindcss-typography)
- [ ] 최대 너비 제한 없음 (`prose-slate max-w-none`)
- [ ] **XSS 방지**: ReactMarkdown 자동 sanitize

### 6.5 클립보드 복사 기능
- [x] 공통 모듈 사용: `copyToClipboard` 함수 활용
- [ ] 복사 버튼 구현 (상단 우측)
- [ ] 복사 성공 시 토스트 메시지 표시
- [ ] 복사 실패 시 에러 토스트 표시
- [ ] 버튼 아이콘 변경 (Copy → Check, 2초 후 복구)
- [ ] **폴백 메서드 지원**: 클립보드 API 미지원 브라우저 대응

### 6.6 네비게이션
- [ ] 목록으로 버튼 (대시보드로 이동)
- [ ] 새 검사하기 버튼 (새 검사 페이지로 이동)
- [ ] Next.js `useRouter` 사용

---

## 7. 상태 관리

### 7.1 필요한 상태
- **`copyIcon`**: 복사 버튼 아이콘 상태 (`'copy' | 'check'`)
- **목적**: 복사 성공 시 2초간 체크 아이콘 표시 후 원래 아이콘으로 복구

### 7.2 상태 관리 방법
- **useState 사용**: 단순 UI 상태이므로 zustand 불필요
- **타이머 관리**: `setTimeout`으로 2초 후 아이콘 복구
- **타이머 정리**: useEffect cleanup 또는 컴포넌트 언마운트 시 타이머 제거

### 7.3 상태 관리 위치
- **AnalysisResultSection 컴포넌트**: 클라이언트 컴포넌트에서 관리

---

## 8. 에러 처리

### 8.1 404 에러 (분석 없음 또는 권한 없음)
- **조건**: `getSajuTest` 반환값이 null
- **처리**: Next.js `notFound()` 호출 → 404 페이지 렌더링
- **보안**: 타인의 분석 접근 시도 시 데이터 존재 여부 노출 방지

### 8.2 인증 에러
- **조건**: Clerk 세션 없음
- **처리**: Clerk 미들웨어가 자동으로 로그인 페이지 리다이렉트

### 8.3 데이터베이스 에러
- **조건**: Supabase 연결 실패 또는 쿼리 에러
- **처리**: `getSajuTest` 내부에서 null 반환 → 404 처리

### 8.4 마크다운 파싱 에러
- **조건**: 잘못된 마크다운 형식
- **처리**: ReactMarkdown이 자동으로 안전하게 파싱
- **폴백**: 파싱 실패 시 원본 텍스트 표시 (ReactMarkdown 기본 동작)

### 8.5 클립보드 API 에러
- **조건**: 브라우저가 클립보드 API 미지원
- **처리**: `copyToClipboard` 함수 내부 폴백 메서드 (textarea 생성 → 복사 → 삭제)
- **사용자 피드백**: 실패 시 에러 토스트 표시

---

## 9. 성능 최적화

### 9.1 Server Component 활용
- **페이지 로드**: 서버에서 데이터 페칭, 초기 HTML 렌더링
- **장점**: SEO 최적화, 빠른 First Contentful Paint

### 9.2 Client Component 최소화
- **인터랙션 필요 부분만**: 복사 버튼, 네비게이션 버튼
- **나머지는 Server**: 정적 정보 표시

### 9.3 코드 스플리팅
- **Next.js 자동 적용**: 페이지 단위 자동 스플리팅
- **동적 import 불필요**: 페이지가 작아서 필요 없음

### 9.4 마크다운 렌더링 최적화
- **Memoization**: MarkdownRenderer 컴포넌트 내부에서 React.memo 적용 가능
- **현재는 불필요**: 페이지 내 단일 마크다운이므로 재렌더링 빈도 낮음

---

## 10. 접근성 요구사항

### 10.1 키보드 네비게이션
- **모든 버튼**: Tab 키로 접근 가능
- **포커스 표시**: 명확한 outline 또는 ring 스타일

### 10.2 스크린 리더 지원
- **ARIA 라벨**: 복사 버튼에 `aria-label="사주분석 결과 복사"`
- **토스트 메시지**: `aria-live="polite"` (useToast가 자동 처리)
- **제목 계층**: h1 (페이지), h2 (섹션 제목) 순서 준수

### 10.3 색상 대비
- **WCAG AA 기준**: 텍스트와 배경 색상 대비율 4.5:1 이상
- **Tailwind 기본값**: 충분한 대비율 제공

### 10.4 터치 친화성
- **버튼 크기**: 최소 44x44px (모바일)
- **간격**: 충분한 여백으로 오터치 방지

---

## 11. 파일 구조 및 경로

### 11.1 페이지 파일
```
src/app/dashboard/results/[id]/
└── page.tsx
```

### 11.2 컴포넌트 파일 (신규 생성 또는 업데이트)
```
src/features/saju/components/
├── analysis-info-card.tsx (업데이트: 모델 뱃지 추가)
├── analysis-result-section.tsx (업데이트: Pro/Free 안내 메시지 추가)
├── navigation-buttons.tsx (기존 사용)
└── result-detail-client.tsx (기존 사용)
```

### 11.3 타입 및 쿼리 (업데이트 필요)
```
src/features/saju/
├── queries/
│   └── get-saju-test.ts (업데이트: modelUsed 필드 추가)
├── types/
│   └── result.ts (업데이트: modelUsed 필드 추가)
```

### 11.4 기존 공통 모듈 (재사용)
```
src/components/
├── markdown-renderer.tsx (기존)
└── layout/
    └── dashboard-header.tsx (기존)

src/lib/utils/
├── clipboard.ts (기존)
└── date.ts (기존)

src/hooks/
└── use-toast.ts (기존)
```

---

## 12. 구현 단계

### Phase 1: 타입 및 쿼리 업데이트 (필수 선행 작업)
1. `src/features/saju/types/result.ts` 업데이트
   - `SajuTestResult`에 `modelUsed: 'flash' | 'pro'` 필드 추가
2. `src/features/saju/queries/get-saju-test.ts` 업데이트
   - `analysis_result` → `result` 매핑 확인
   - `model_used` → `modelUsed` 매핑 추가

### Phase 2: 분석 대상 정보 카드 업데이트
3. `src/features/saju/components/analysis-info-card.tsx` 업데이트
   - `modelUsed` props 추가
   - 모델 정보 뱃지 추가 (flash: "기본 분석", pro: "Pro 고급 분석")
   - Sparkles 아이콘 추가 (Pro인 경우)

### Phase 3: 분석 결과 섹션 업데이트
4. `src/features/saju/components/analysis-result-section.tsx` 업데이트
   - `modelUsed` props 추가
   - Pro/Free 안내 메시지 추가 (조건부 렌더링)
   - 안내 메시지 스타일링 (Alert 컴포넌트 또는 Card)

### Phase 4: 페이지 통합 및 테스트
5. 모든 컴포넌트 통합 확인
6. 스타일링 및 반응형 확인
7. 기능 테스트 (복사, 네비게이션, 모델 표시)

---

## 13. 모듈 개요

### 13.1 Server Component (page.tsx)
- **위치**: `src/app/dashboard/results/[id]/page.tsx`
- **역할**: 데이터 조회 및 SSR
- **의존성**: `getSajuTest`, `notFound`
- **현재 상태**: 이미 구현됨 (업데이트 불필요)

### 13.2 Client Component (result-detail-client.tsx)
- **위치**: `src/features/saju/components/result-detail-client.tsx`
- **역할**: 클라이언트 인터랙션 통합
- **의존성**: 하위 컴포넌트들, `useRouter`
- **현재 상태**: 이미 구현됨 (업데이트 불필요, 하위 컴포넌트만 수정)

### 13.3 AnalysisInfoCard (업데이트 필요)
- **위치**: `src/features/saju/components/analysis-info-card.tsx`
- **역할**: 분석 대상 정보 표시
- **의존성**: `Card`, `Badge`, `formatDate`, `formatDateTime`
- **업데이트 내용**: `modelUsed` 필드 표시, 모델 뱃지 추가

### 13.4 AnalysisResultSection (업데이트 필요)
- **위치**: `src/features/saju/components/analysis-result-section.tsx`
- **역할**: 결과 렌더링 및 복사 기능
- **의존성**: `MarkdownRenderer`, `copyToClipboard`, `useToast`
- **업데이트 내용**: Pro/Free 안내 메시지 추가

### 13.5 NavigationButtons
- **위치**: `src/features/saju/components/navigation-buttons.tsx`
- **역할**: 페이지 간 네비게이션
- **의존성**: `Button`, `useRouter`
- **현재 상태**: 이미 구현됨 (업데이트 불필요)

---

## 14. Implementation Details

### 14.1 타입 업데이트 (result.ts)

**파일**: `src/features/saju/types/result.ts`

```typescript
export type SajuTestResult = {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  gender: 'male' | 'female';
  result: string;
  modelUsed: 'flash' | 'pro'; // 추가
  createdAt: string;
};
```

**주의사항**:
- 기존 코드와 호환성 유지
- 데이터베이스 컬럼명(`model_used`)과 타입명(`modelUsed`) 매핑 확인

---

### 14.2 쿼리 업데이트 (get-saju-test.ts)

**파일**: `src/features/saju/queries/get-saju-test.ts`

**현재 코드**:
```typescript
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
```

**업데이트 필요**:
```typescript
return {
  id: data.id,
  userId: data.user_id,
  name: data.name,
  birthDate: data.birth_date,
  birthTime: data.birth_time,
  gender: data.gender as 'male' | 'female',
  result: data.analysis_result, // 컬럼명 확인 필요
  modelUsed: data.model_used as 'flash' | 'pro', // 추가
  createdAt: data.created_at,
};
```

**확인 사항**:
- 데이터베이스 컬럼명이 `result`인지 `analysis_result`인지 확인 필요
- 데이터베이스에 `model_used` 컬럼 존재 여부 확인
- 타입 캐스팅 안전성 확인

---

### 14.3 AnalysisInfoCard 업데이트

**파일**: `src/features/saju/components/analysis-info-card.tsx`

**추가 내용**:
```typescript
import { Sparkles } from 'lucide-react';

// 기존 코드에 추가
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground min-w-[80px]">분석 유형</span>
  <Badge variant={sajuTest.modelUsed === 'pro' ? 'default' : 'secondary'} className="gap-1">
    {sajuTest.modelUsed === 'pro' && <Sparkles className="h-3 w-3" />}
    {sajuTest.modelUsed === 'pro' ? 'Pro 고급 분석' : '기본 분석'}
  </Badge>
</div>
```

**스타일링**:
- Pro: default variant (primary color) + Sparkles 아이콘
- Free: secondary variant (gray color)

---

### 14.4 AnalysisResultSection 업데이트

**파일**: `src/features/saju/components/analysis-result-section.tsx`

**추가 내용**:
```typescript
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Info } from 'lucide-react';

type AnalysisResultSectionProps = {
  result: string;
  modelUsed: 'flash' | 'pro'; // 추가
};

export function AnalysisResultSection({ result, modelUsed }: AnalysisResultSectionProps) {
  // 기존 복사 로직...

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">사주분석 결과</h2>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="사주분석 결과 복사"
        >
          {copyIcon === 'copy' ? (
            <Copy className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          결과 복사
        </Button>
      </div>

      {/* Pro/Free 안내 메시지 (신규) */}
      {modelUsed === 'pro' ? (
        <Alert className="border-primary bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription>
            이 분석은 <strong>Pro 구독</strong>으로 생성된 고급 분석입니다.
            직업운, 사업운, 월별 운세가 포함되어 있습니다.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            기본 분석 결과입니다. <strong>Pro 구독</strong> 시 더욱 상세한 분석을 받을 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg p-6">
        <MarkdownRenderer content={result} />
      </div>
    </div>
  );
}
```

**스타일링**:
- Pro: border-primary, bg-primary/5 (강조 스타일)
- Free: 기본 Alert 스타일

---

## 15. 테스트 시나리오

### 15.1 성공 케이스

| 테스트 ID | 전제 조건 | 테스트 단계 | 기대 결과 |
|----------|----------|----------|----------|
| TC-01 | 로그인 상태, 본인의 유효한 분석 ID | 대시보드에서 이력 카드 클릭 | 상세 페이지 로드, 정보 카드 및 분석 결과 정상 표시 |
| TC-02 | 상세 페이지 표시 상태 | "결과 복사" 버튼 클릭 | 클립보드에 마크다운 텍스트 복사, 성공 토스트 표시 |
| TC-03 | 상세 페이지 표시 상태 | "목록으로" 버튼 클릭 | 대시보드 페이지로 이동 |
| TC-04 | 상세 페이지 표시 상태 | "새 검사하기" 버튼 클릭 | 새 검사하기 페이지로 이동 |
| TC-05 | Pro 모델로 생성된 분석 | 상세 페이지 접근 | "Pro 고급 분석" 뱃지 표시, Pro 안내 메시지 표시 |
| TC-06 | Free 모델로 생성된 분석 | 상세 페이지 접근 | "기본 분석" 뱃지 표시, Free 안내 메시지 표시 |
| TC-07 | 출생시간 없는 분석 | 상세 페이지 접근 | 출생시간 필드에 "미상" 표시 |

### 15.2 실패 케이스

| 테스트 ID | 전제 조건 | 테스트 단계 | 기대 결과 |
|----------|----------|----------|----------|
| TC-08 | 비로그인 상태 | URL 직접 입력하여 상세 페이지 접근 | 로그인 페이지로 리다이렉트 |
| TC-09 | 로그인 상태 | 존재하지 않는 분석 ID로 접근 | 404 페이지 표시 |
| TC-10 | 로그인 상태 | 다른 사용자의 분석 ID로 접근 | 404 페이지 표시 (정보 노출 방지) |
| TC-11 | 로그인 상태 | 잘못된 UUID 형식으로 접근 | 404 페이지 표시 |
| TC-12 | Supabase 서비스 중단 | 상세 페이지 접근 | 에러 메시지 또는 404 페이지 표시 |
| TC-13 | 클립보드 API 미지원 브라우저 | "결과 복사" 버튼 클릭 | 폴백 메서드로 복사 시도, 성공 또는 에러 토스트 |

### 15.3 엣지 케이스

| 테스트 ID | 전제 조건 | 테스트 단계 | 기대 결과 |
|----------|----------|----------|----------|
| TC-14 | 매우 긴 분석 결과 (10,000자 이상) | 상세 페이지 접근 | 스크롤 가능, 성능 저하 없이 렌더링 |
| TC-15 | 특수문자가 많은 이름 | 상세 페이지 접근 | XSS 없이 정상 표시 |
| TC-16 | 동시에 여러 브라우저 탭에서 접근 | 동일 분석 상세 페이지 접근 | 모든 탭에서 정상 표시 |
| TC-17 | 모바일 환경 | 상세 페이지 접근 및 복사 | 반응형 레이아웃, 터치 친화적 버튼 |
| TC-18 | 데이터베이스에 model_used 필드 없음 | 상세 페이지 접근 | undefined 처리, 기본값 또는 에러 처리 |

---

## 16. 구현 체크리스트

### Phase 1: 타입 및 쿼리 업데이트
- [ ] `src/features/saju/types/result.ts`에 `modelUsed` 필드 추가
- [ ] `src/features/saju/queries/get-saju-test.ts`에서 `model_used` 매핑 추가
- [ ] 데이터베이스 컬럼명 확인 (`result` vs `analysis_result`)
- [ ] 타입 검증 (TypeScript 컴파일 에러 없음)

### Phase 2: 정보 카드 업데이트
- [ ] `analysis-info-card.tsx`에 모델 뱃지 UI 추가
- [ ] Sparkles 아이콘 import 및 Pro 표시
- [ ] 스타일링 확인 (Pro: primary, Free: secondary)

### Phase 3: 결과 섹션 업데이트
- [ ] `analysis-result-section.tsx`에 `modelUsed` props 추가
- [ ] Pro/Free 안내 메시지 Alert 컴포넌트 추가
- [ ] 조건부 렌더링 확인
- [ ] 스타일링 확인

### Phase 4: 테스트 및 검증
- [ ] 성공 케이스 테스트 (TC-01 ~ TC-07)
- [ ] 실패 케이스 테스트 (TC-08 ~ TC-13)
- [ ] 엣지 케이스 테스트 (TC-14 ~ TC-18)
- [ ] 반응형 확인 (320px ~ 1920px)
- [ ] 접근성 확인 (키보드, 스크린 리더)

---

## 17. 주의사항

### 17.1 데이터베이스 스키마 확인
- **analyses 테이블에 `model_used` 컬럼 존재 여부 확인** 필수
- 컬럼이 없다면 마이그레이션 필요:
  ```sql
  ALTER TABLE analyses
  ADD COLUMN model_used text NOT NULL DEFAULT 'flash'
  CHECK (model_used IN ('flash', 'pro'));
  ```

### 17.2 기존 데이터 호환성
- 기존 분석 데이터에 `model_used` 값이 없을 수 있음
- 기본값 처리 또는 null 체크 필요
- 쿼리에서 `COALESCE(model_used, 'flash')` 사용 고려

### 17.3 보안
- **RLS 정책**: 본인 분석만 조회 보장
- **XSS 방지**: ReactMarkdown 자동 sanitize
- **타인 접근 시도**: 404 페이지로 정보 노출 방지

### 17.4 성능
- Server Component로 초기 로딩 최적화
- 마크다운 렌더링은 클라이언트에서 수행 (ReactMarkdown 특성)
- 매우 긴 분석 결과도 문제없이 렌더링 (테스트 필요)

### 17.5 접근성
- 모든 버튼 키보드 접근 가능
- ARIA 라벨 명확히 설정
- 색상 대비 WCAG AA 준수

---

## 18. 향후 개선 가능성

### 18.1 기능 추가
- PDF 다운로드 기능
- 소셜 공유 기능 (링크 공유)
- 분석 결과 삭제 기능
- 분석 결과 수정 기능

### 18.2 성능 최적화
- 마크다운 렌더링 캐싱
- 이미지 최적화 (분석 결과에 이미지 포함 시)
- Suspense 경계 추가 (로딩 상태 개선)

### 18.3 UX 개선
- 분석 결과 인쇄 최적화
- 다크 모드 지원
- 분석 결과 음성 읽기 기능

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
| 2.0 | 2025-10-28 | Claude Code | 구독 기능 추가 반영: modelUsed 필드, Pro/Free 차이 표현, 보안 강화, 에러 처리 개선 |
