# 새 검사하기 페이지 구현 계획

## 1. 페이지 개요 및 목적

### 1.1 페이지 설명
새 사주분석 요청을 위한 입력 폼 페이지입니다. 사용자의 기본 정보(성함, 생년월일, 출생시간, 성별)를 입력받아 Gemini API를 통한 AI 사주분석을 수행하고, 결과를 데이터베이스에 저장한 후 상세 페이지로 이동합니다.

### 1.2 핵심 기능
- 사주분석 대상 정보 입력 폼
- 실시간 클라이언트 측 입력 검증
- Gemini API를 통한 AI 사주분석 실행
- 분석 진행 상태 표시 (로딩 스피너)
- 분석 완료 후 자동 결과 페이지 이동

### 1.3 예상 소요 시간
- 폼 UI 구현: 2시간
- 검증 로직 및 상태 관리: 1시간
- 통합 및 테스트: 1시간
- **총 예상 시간: 4시간**

---

## 2. 라우트 및 접근 권한

### 2.1 라우트 정보
- **경로**: `/dashboard/new`
- **라우트 타입**: Protected Route (인증 필요)
- **파일 위치**: `src/app/(protected)/dashboard/new/page.tsx`

### 2.2 접근 권한
- **로그인 필수**: Clerk 인증 세션 필요
- **권한 검증**: Clerk Middleware에서 자동 처리
- **비로그인 시**: Clerk 로그인 페이지로 자동 리다이렉트

### 2.3 네비게이션
- **접근 경로**:
  - 대시보드에서 "새 검사하기" 버튼 클릭
  - 헤더 네비게이션에서 "새 검사" 메뉴 클릭
  - 빈 상태에서 "첫 검사 시작하기" 버튼 클릭
- **이동 경로**:
  - 분석 완료 → `/dashboard/results/[id]`

---

## 3. 사용할 공통 모듈 목록

### 3.1 데이터 및 타입
- `src/features/saju/types/input.ts` - `SajuInput`, `sajuInputSchema` (이미 구현됨)
- `src/lib/supabase/types.ts` - Database 타입 정의 (이미 구현됨)

### 3.2 서버 액션
- `src/features/saju/actions/create-saju-test.ts` - `createSajuTest()` (이미 구현됨)
  - Gemini API 호출
  - 데이터베이스 저장
  - 결과 페이지로 리다이렉트

### 3.3 인증
- `@clerk/nextjs` - 사용자 인증 상태 확인
- Clerk Middleware - 자동 인증 검증

### 3.4 UI 컴포넌트
- `src/components/layout/dashboard-header.tsx` - 공통 헤더 (이미 구현됨)
- `src/components/ui/input.tsx` - 텍스트 입력 (shadcn/ui)
- `src/components/ui/button.tsx` - 버튼 (shadcn/ui)
- `src/components/ui/label.tsx` - 레이블 (shadcn/ui)
- `src/components/ui/checkbox.tsx` - 체크박스 (shadcn/ui)
- `src/components/ui/spinner.tsx` - 로딩 스피너 (이미 구현됨)
- `src/components/ui/time-picker.tsx` - 시간 선택 (이미 구현됨)
- `src/components/ui/toast.tsx` / `src/components/ui/toaster.tsx` - 토스트 알림 (shadcn/ui)

### 3.5 필요한 새 컴포넌트
- `src/components/ui/date-picker.tsx` - 생년월일 선택 컴포넌트 (구현 필요)
- `src/components/ui/radio-group.tsx` - 성별 선택 라디오 그룹 (shadcn/ui 추가 필요)

### 3.6 유틸리티
- `zod` - 스키마 검증
- `react-hook-form` - 폼 상태 관리
- `@hookform/resolvers/zod` - react-hook-form과 zod 연동

---

## 4. 페이지 컴포넌트 구조

### 4.1 컴포넌트 계층 구조

```
NewAnalysisPage (Server Component)
└── NewAnalysisForm (Client Component)
    ├── FormField: 성함 입력
    │   └── Input
    ├── FormField: 생년월일 입력
    │   └── DatePicker (구현 필요)
    ├── FormField: 출생시간 입력
    │   ├── TimePicker (이미 구현됨)
    │   └── Checkbox (출생시간 모름)
    ├── FormField: 성별 선택
    │   └── RadioGroup (추가 필요)
    └── SubmitButton
        └── Spinner (로딩 시)
```

### 4.2 파일 구조

```
src/app/(protected)/dashboard/new/
└── page.tsx (Server Component - 레이아웃 및 헤더)

src/features/saju/components/
└── new-analysis-form.tsx (Client Component - 폼 로직)
```

---

## 5. 구현할 기능 목록

### 5.1 폼 입력 필드

#### 5.1.1 성함 (필수)
- **타입**: 텍스트 입력
- **검증**:
  - 최소 1자
  - 최대 50자
  - 에러 메시지: "성함을 입력해주세요" / "성함은 50자 이하로 입력해주세요"

#### 5.1.2 생년월일 (필수)
- **타입**: DatePicker 또는 텍스트 입력
- **포맷**: YYYY-MM-DD
- **검증**:
  - 유효한 날짜 형식
  - 1900-01-01 ~ 현재 날짜
  - 에러 메시지: "올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요"
- **구현 필요**: DatePicker 컴포넌트

#### 5.1.3 출생시간 (선택)
- **타입**: TimePicker (이미 구현됨)
- **포맷**: HH:mm
- **특수 기능**: "출생시간 모름" 체크박스
  - 체크 시 시간 입력 비활성화
  - 체크 해제 시 시간 입력 활성화
- **검증**:
  - HH:mm 형식 (입력 시)
  - nullable 허용

#### 5.1.4 성별 (필수)
- **타입**: RadioGroup (shadcn/ui 추가 필요)
- **옵션**: 남성 / 여성
- **검증**:
  - 필수 선택
  - 에러 메시지: "성별을 선택해주세요"

### 5.2 실시간 검증
- 각 필드 onChange 이벤트에서 zod 스키마 검증
- 에러 발생 시 필드 아래 빨간색 에러 메시지 표시
- 필드 테두리 색상 변경 (빨간색)

### 5.3 제출 버튼 활성화 조건
- 모든 필수 항목 입력 완료
- 모든 필드 검증 통과
- 조건 미충족 시 버튼 비활성화

### 5.4 분석 실행 플로우
1. 사용자가 "검사 시작" 버튼 클릭
2. 버튼 비활성화
3. 로딩 스피너 표시
4. `createSajuTest()` Server Action 호출
5. Gemini API 분석 실행 (10-30초)
6. 데이터베이스 저장
7. 성공 시: 상세 페이지로 자동 리다이렉트
8. 실패 시: 에러 토스트 메시지 표시, 버튼 재활성화

### 5.5 에러 처리
- **폼 검증 실패**: 필드별 에러 메시지 표시
- **API 호출 실패**: 토스트 메시지 "분석 중 오류가 발생했습니다. 다시 시도해주세요."
- **타임아웃**: 토스트 메시지 "요청 시간이 초과되었습니다. 다시 시도해주세요."
- **네트워크 에러**: 토스트 메시지 "네트워크 연결을 확인해주세요."
- **세션 만료**: Clerk 자동 로그인 페이지 리다이렉트

---

## 6. 상태 관리

### 6.1 폼 상태 (react-hook-form)
- **라이브러리**: `react-hook-form` + `zod` resolver
- **상태 관리 항목**:
  - `name`: string
  - `birthDate`: string (YYYY-MM-DD)
  - `birthTime`: string | null (HH:mm)
  - `birthTimeUnknown`: boolean
  - `gender`: 'male' | 'female'

### 6.2 UI 상태
- **isLoading**: boolean - 분석 진행 중 여부
- **error**: string | null - 전역 에러 메시지

### 6.3 상태 관리 방식
```typescript
const form = useForm<SajuInput>({
  resolver: zodResolver(sajuInputSchema),
  defaultValues: {
    name: '',
    birthDate: '',
    birthTime: null,
    birthTimeUnknown: false,
    gender: undefined,
  },
});

const [isLoading, setIsLoading] = useState(false);
```

---

## 7. API 호출

### 7.1 Server Action 호출
- **함수**: `createSajuTest(input: SajuInput)`
- **위치**: `src/features/saju/actions/create-saju-test.ts` (이미 구현됨)
- **입력**: SajuInput 객체
- **출력**:
  - 성공: `{ success: true, testId: string }` → 자동 리다이렉트
  - 실패: `{ success: false, error: string }` → 에러 메시지 표시

### 7.2 호출 흐름
```typescript
const onSubmit = async (data: SajuInput) => {
  setIsLoading(true);

  try {
    const result = await createSajuTest(data);

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "분석 실패",
        description: result.error,
      });
    }
    // 성공 시 서버 액션 내부에서 redirect 처리됨
  } catch (error) {
    toast({
      variant: "destructive",
      title: "오류 발생",
      description: "분석 중 오류가 발생했습니다. 다시 시도해주세요.",
    });
  } finally {
    setIsLoading(false);
  }
};
```

---

## 8. 파일 구조 및 경로

### 8.1 신규 생성 파일

```
src/app/(protected)/dashboard/new/
└── page.tsx                                    # 새 검사하기 페이지 (Server Component)

src/features/saju/components/
└── new-analysis-form.tsx                       # 새 검사 입력 폼 (Client Component)

src/components/ui/
├── date-picker.tsx                             # 생년월일 선택 컴포넌트 (구현 필요)
└── radio-group.tsx                             # 라디오 그룹 (shadcn/ui 추가)
```

### 8.2 기존 파일 활용

```
src/features/saju/
├── types/
│   └── input.ts                                # SajuInput 타입 (이미 구현됨)
├── actions/
│   └── create-saju-test.ts                     # Server Action (이미 구현됨)

src/components/
├── layout/
│   └── dashboard-header.tsx                    # 헤더 (이미 구현됨)
└── ui/
    ├── input.tsx                               # 텍스트 입력
    ├── button.tsx                              # 버튼
    ├── label.tsx                               # 레이블
    ├── checkbox.tsx                            # 체크박스
    ├── spinner.tsx                             # 로딩 스피너 (이미 구현됨)
    ├── time-picker.tsx                         # 시간 선택 (이미 구현됨)
    └── toast.tsx / toaster.tsx                 # 토스트 알림
```

---

## 9. 구현 단계

### Phase 1: 필수 컴포넌트 준비 (1시간)

#### Step 1.1: DatePicker 컴포넌트 구현
```bash
# shadcn/ui calendar, popover 설치
npx shadcn@latest add calendar popover

# date-fns 설치
pnpm add date-fns
```

**파일**: `src/components/ui/date-picker.tsx`

**기능**:
- 달력 UI로 날짜 선택
- 1900-01-01 ~ 현재 날짜만 선택 가능
- 선택한 날짜를 YYYY-MM-DD 형식으로 반환
- 한국어 로케일 지원

#### Step 1.2: RadioGroup 컴포넌트 추가
```bash
# shadcn/ui radio-group 설치
npx shadcn@latest add radio-group
```

### Phase 2: 페이지 및 폼 컴포넌트 구현 (2시간)

#### Step 2.1: 페이지 레이아웃 구현
**파일**: `src/app/(protected)/dashboard/new/page.tsx`

```typescript
import { NewAnalysisForm } from '@/features/saju/components/new-analysis-form';

export default function NewAnalysisPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">새 사주분석</h1>
          <p className="text-muted-foreground mt-2">
            분석하실 분의 정보를 입력해주세요
          </p>
        </div>
        <NewAnalysisForm />
      </div>
    </div>
  );
}
```

#### Step 2.2: 폼 컴포넌트 구현
**파일**: `src/features/saju/components/new-analysis-form.tsx`

**구현 내용**:
1. react-hook-form 설정
2. zod resolver 연동
3. 각 필드 렌더링
4. 실시간 검증
5. 제출 핸들러
6. 로딩 상태 처리
7. 에러 토스트 표시

**주요 로직**:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sajuInputSchema, type SajuInput } from '../types/input';
import { createSajuTest } from '../actions/create-saju-test';
import { useToast } from '@/components/ui/use-toast';

export function NewAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SajuInput>({
    resolver: zodResolver(sajuInputSchema),
    defaultValues: {
      name: '',
      birthDate: '',
      birthTime: null,
      birthTimeUnknown: false,
      gender: undefined,
    },
  });

  const onSubmit = async (data: SajuInput) => {
    setIsLoading(true);

    try {
      const result = await createSajuTest(data);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "분석 실패",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "분석 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 폼 필드 렌더링...
}
```

### Phase 3: 통합 및 테스트 (1시간)

#### Step 3.1: 기능 테스트
- [ ] 페이지 접근 가능 여부
- [ ] 비로그인 시 리다이렉트 확인
- [ ] 각 필드 입력 및 검증
- [ ] 출생시간 모름 체크박스 동작
- [ ] 제출 버튼 활성화/비활성화
- [ ] API 호출 및 로딩 상태
- [ ] 성공 시 리다이렉트
- [ ] 실패 시 에러 메시지

#### Step 3.2: 반응형 테스트
- [ ] 모바일 (320px ~ 767px)
- [ ] 태블릿 (768px ~ 1023px)
- [ ] 데스크톱 (1024px 이상)

#### Step 3.3: 접근성 테스트
- [ ] 키보드 네비게이션 (Tab, Enter)
- [ ] ARIA 레이블
- [ ] 스크린 리더 호환성

---

## 10. 주의사항

### 10.1 기존 코드 충돌 방지

#### 확인된 기존 구현
- `src/features/saju/types/input.ts` - 이미 구현됨, 그대로 사용
- `src/features/saju/actions/create-saju-test.ts` - 이미 구현됨, 그대로 사용
- `src/components/layout/dashboard-header.tsx` - 이미 구현됨, 레이아웃에서 사용
- `src/components/ui/time-picker.tsx` - 이미 구현됨, 그대로 사용
- `src/components/ui/spinner.tsx` - 이미 구현됨, 로딩 상태에서 사용

#### 구현 필요 항목
- `src/components/ui/date-picker.tsx` - 신규 구현 (기존에 없음)
- `src/components/ui/radio-group.tsx` - shadcn/ui 추가 (기존에 없음)
- `src/app/(protected)/dashboard/new/page.tsx` - 신규 구현
- `src/features/saju/components/new-analysis-form.tsx` - 신규 구현

### 10.2 데이터 검증

#### 클라이언트 측 검증
- react-hook-form + zod resolver 사용
- 실시간 에러 표시
- 제출 전 최종 검증

#### 서버 측 검증
- `createSajuTest()` 내부에서 `sajuInputSchema.parse()` 재검증
- 이미 구현되어 있음

### 10.3 보안

#### 인증
- Clerk Middleware에서 자동 처리
- 비로그인 시 자동 리다이렉트

#### 데이터 보안
- API 키는 서버 환경 변수에서만 사용 (이미 구현됨)
- Supabase RLS로 본인 데이터만 생성 가능 (이미 설정됨)

### 10.4 성능

#### 로딩 최적화
- 서버 컴포넌트 활용 (페이지 레이아웃)
- 클라이언트 컴포넌트 최소화 (폼만)
- 코드 스플리팅 자동 적용

#### UX 최적화
- 로딩 스피너로 진행 상태 표시
- 예상 대기 시간 안내 (10-30초)
- 에러 발생 시 명확한 메시지

### 10.5 에러 처리

#### 예상 에러 시나리오
1. **폼 검증 실패**: 필드별 에러 메시지 표시
2. **Gemini API 실패**: "분석 중 오류가 발생했습니다" 토스트
3. **데이터베이스 저장 실패**: "결과 저장에 실패했습니다" 토스트
4. **세션 만료**: Clerk 자동 로그인 페이지 리다이렉트
5. **네트워크 에러**: "네트워크 연결을 확인해주세요" 토스트

#### 에러 복구
- 토스트 메시지로 사용자에게 알림
- 버튼 재활성화하여 재시도 가능
- 입력 데이터는 유지됨

### 10.6 테스트 체크리스트

#### 기능 테스트
- [ ] 모든 필드 입력 가능
- [ ] 실시간 검증 동작
- [ ] 출생시간 모름 체크박스 동작
- [ ] 제출 버튼 활성화/비활성화
- [ ] API 호출 성공
- [ ] 분석 결과 페이지로 이동
- [ ] 에러 처리 동작

#### 엣지케이스 테스트
- [ ] 필수 항목 미입력 시 제출 불가
- [ ] 잘못된 날짜 형식 입력 시 에러 표시
- [ ] 미래 날짜 입력 시 에러 표시
- [ ] 1900년 이전 날짜 입력 시 에러 표시
- [ ] API 실패 시 에러 메시지 표시
- [ ] 중복 제출 방지 (버튼 비활성화)

#### 접근성 테스트
- [ ] Tab 키로 모든 필드 접근 가능
- [ ] Enter 키로 제출 가능
- [ ] 에러 메시지 스크린 리더 읽기 가능
- [ ] 필드 레이블 명확

#### 반응형 테스트
- [ ] 모바일에서 레이아웃 정상
- [ ] 터치 입력 편의성
- [ ] 키보드 표시 시 레이아웃 유지

---

## 11. 완성 기준

### 11.1 필수 기능
- [x] 모든 필드 입력 가능
- [x] 실시간 검증 동작
- [x] API 호출 및 분석 실행
- [x] 성공 시 결과 페이지 이동
- [x] 실패 시 에러 메시지 표시

### 11.2 UI/UX
- [x] 일관된 디자인 (shadcn/ui)
- [x] 로딩 상태 명확
- [x] 에러 메시지 명확
- [x] 반응형 디자인

### 11.3 성능
- [x] 페이지 로드 3초 이내
- [x] 폼 입력 응답 즉각적
- [x] API 호출 60초 타임아웃

### 11.4 보안
- [x] 인증 검증
- [x] 서버 측 재검증
- [x] XSS 방지 (React 자동 이스케이프)

---

## 12. 참고 자료

### 12.1 관련 문서
- [PRD 문서](/docs/prd.md)
- [공통 모듈 계획](/docs/common-modules.md)
- [UC-002: 새 사주분석 요청](/docs/usecases/2-new-analysis/spec.md)
- [데이터베이스 설계](/docs/database.md)
- [Userflow 명세서](/docs/userflow.md)

### 12.2 기술 문서
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Clerk Next.js](https://clerk.com/docs/quickstarts/nextjs)

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 1.0 | 2025-10-27 | Claude Code | 초안 작성 |
