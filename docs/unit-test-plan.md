# Unit Test 작성 계획 (페이지별)

## 개요

이 문서는 각 페이지의 핵심 기능을 대상으로 한 Unit Test 작성 계획입니다.
TDD(Test-Driven Development) 프로세스를 따르며, MVP 완성에 필요한 핵심 기능만 테스트합니다.

**테스트 전략:**
- Unit Test: Jest + @testing-library/react (컴포넌트, 함수)
- 테스트 피라미드: Unit 70%, Integration 20%, E2E 10%
- 모킹 우선: 외부 의존성(API, DB)은 철저히 모킹
- 빠른 실행: 각 단위 테스트는 100ms 이내

---

## 1. 홈(랜딩) 페이지 (`/`)

### 1.1 테스트할 주요 기능

#### A. 인증 상태별 조건부 렌더링
- 비로그인: "무료로 시작하기" 표시
- 로그인: "이용하기" 버튼 표시

#### B. CTA 버튼 동작
- "무료로 시작하기" 클릭 → Clerk 로그인 모달 트리거
- "이용하기" 클릭 → /dashboard 네비게이션
- Pricing 섹션 버튼 동작

#### C. 앵커 네비게이션
- 헤더 메뉴 클릭 → 해당 섹션 스크롤
- 모든 섹션 ID 존재 여부 확인

#### D. 렌더링
- 모든 섹션(Hero, Features, Pricing, FAQ, Footer) 렌더링
- FAQ 아코디언 토글 동작
- 카드 렌더링 정확성

### 1.2 테스트 코드 구조

```
tests/unit/pages/
└── home.test.tsx
    ├── "홈 페이지 렌더링"
    │   ├── "모든 섹션 렌더링"
    │   ├── "Hero 섹션 텍스트 정확성"
    │   ├── "Features 4개 카드 렌더링"
    │   ├── "Pricing 2개 카드 렌더링"
    │   └── "FAQ 6개 아이템 렌더링"
    │
    ├── "인증 상태별 렌더링"
    │   ├── "비로그인: 시작하기 버튼"
    │   └── "로그인: 이용하기 버튼"
    │
    ├── "CTA 버튼"
    │   ├── "시작하기 클릭 → SignInButton 트리거"
    │   ├── "이용하기 클릭 → /dashboard 이동"
    │   └── "Pro 시작하기 클릭 → 구독 페이지 이동"
    │
    ├── "앵커 네비게이션"
    │   ├── "섹션 ID 확인 (#hero, #features 등)"
    │   └── "헤더 링크 href 확인"
    │
    └── "FAQ 아코디언"
        ├── "FAQ 항목 클릭 → 열림"
        └── "다시 클릭 → 닫힘"
```

### 1.3 모킹 전략

```typescript
// Clerk SDK 모킹
jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  SignInButton: ({ children }) => <button>{children}</button>,
  UserButton: () => <div>User</div>,
}));

// Next.js Link 모킹 (선택)
jest.mock('next/link', () => {
  return ({ children, href }) => <a href={href}>{children}</a>;
});
```

### 1.4 테스트 시나리오

| 테스트 ID | 제목 | AAA 패턴 |
|----------|------|---------|
| HT-01 | 모든 섹션이 렌더링됨 | Arrange: 페이지 렌더링 / Act: 없음 / Assert: 섹션 6개 존재 확인 |
| HT-02 | 비로그인 시 "시작하기" 버튼 표시 | Arrange: SignedOut 모킹 / Act: 렌더링 / Assert: "무료로 시작하기" 텍스트 확인 |
| HT-03 | 로그인 시 "이용하기" 버튼 표시 | Arrange: SignedIn 모킹 / Act: 렌더링 / Assert: "이용하기" 링크 확인 |
| HT-04 | FAQ 아이템 클릭 시 토글 | Arrange: FAQ 섹션 렌더링 / Act: 항목 클릭 / Assert: 펼침/닫힘 상태 변경 |
| HT-05 | Pricing 무료/Pro 카드 존재 | Arrange: Pricing 섹션 렌더링 / Act: 없음 / Assert: 2개 카드 확인 |

---

## 2. 대시보드 페이지 (`/dashboard`)

### 2.1 테스트할 주요 기능

#### A. 사주분석 이력 목록 조회
- 초기 10개 렌더링
- 빈 상태 처리 (이력 없음)
- 카드 정보 정확성 (이름, 생년월일, 성별, 날짜)

#### B. 검색 기능
- 검색어 입력 → 실시간 필터링
- 검색 결과 없을 때 빈 상태 표시
- 검색어 클리어 → 전체 목록 복구

#### C. 페이지네이션
- "더보기" 버튼 클릭 → 추가 10개 로드
- hasMore 상태에 따른 버튼 표시/숨김

#### D. 카드 상호작용
- 카드 클릭 → /dashboard/results/[id] 이동
- 호버 효과 (선택)
- 키보드 네비게이션 (Tab, Enter)

#### E. 사이드바
- 구독 정보 표시 (요금제, 잔여 횟수, 다음 결제일)
- 네비게이션 링크 활성화 상태

### 2.2 테스트 코드 구조

```
tests/unit/pages/
└── dashboard.test.tsx
    ├── "대시보드 페이지"
    │   ├── "10개 카드 초기 렌더링"
    │   ├── "이력 없음 빈 상태"
    │   └── "카드 정보 정확성"
    │
    ├── "검색 기능"
    │   ├── "검색어 입력 → 필터링"
    │   ├── "검색 결과 없음 → 빈 상태"
    │   └── "클리어 버튼 → 전체 목록 복구"
    │
    ├── "페이지네이션"
    │   ├── "더보기 버튼 클릭 → 10개 추가"
    │   ├── "hasMore false → 버튼 숨김"
    │   └── "로딩 상태 표시"
    │
    ├── "카드 상호작용"
    │   ├── "카드 클릭 → 상세 페이지 이동"
    │   └── "키보드 네비게이션 (Tab, Enter)"
    │
    └── "사이드바"
        ├── "구독 정보 표시"
        └── "네비게이션 링크 활성화"

tests/unit/components/
└── saju/
    ├── search-bar.test.tsx
    │   ├── "검색어 입력 → 300ms 후 onSearch 호출"
    │   ├── "클리어 버튼 클릭"
    │   └── "초기값 설정"
    │
    ├── saju-test-card.test.tsx
    │   ├── "카드 정보 렌더링"
    │   ├── "카드 클릭 → useRouter 호출"
    │   └── "포맷팅 (날짜, 성별 뱃지)"
    │
    └── load-more-button.test.tsx
        ├── "버튼 클릭 → onLoadMore 호출"
        ├── "로딩 중 버튼 비활성화"
        └── "hasMore false → 버튼 숨김"
```

### 2.3 모킹 전략

```typescript
// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Server Action 모킹 (loadMoreTests)
jest.mock('@/features/saju/actions/load-more-tests', () => ({
  loadMoreTests: jest.fn().mockResolvedValue({
    success: true,
    data: [/* mock data */],
    hasMore: true,
  }),
}));

// getSajuTests 모킹
jest.mock('@/features/saju/queries/get-saju-tests', () => ({
  getSajuTests: jest.fn().mockResolvedValue([/* mock data */]),
}));
```

### 2.4 테스트 시나리오

| 테스트 ID | 제목 | 입력 | 기대 결과 |
|----------|------|------|---------|
| DB-01 | 초기 10개 카드 렌더링 | initialTests: 10개 배열 | 10개 카드 렌더링 |
| DB-02 | 검색어 입력 → 필터링 | searchQuery: "홍길동" | "홍길동" 포함 카드만 표시 |
| DB-03 | 검색 결과 없음 | searchQuery: "없는 이름" | EmptyState 렌더링 |
| DB-04 | 더보기 버튼 클릭 | hasMore: true | loadMoreTests 호출, 10개 추가 |
| DB-05 | 카드 클릭 | 클릭 | router.push(`/dashboard/results/${id}`) 호출 |
| DB-06 | 이력 없음 | tests: [] | "아직 사주분석 이력이 없습니다" 표시 |

---

## 3. 새 사주분석 페이지 (`/dashboard/new`)

### 3.1 테스트할 주요 기능

#### A. 폼 입력 및 실시간 검증
- 성함: 1-50자 검증
- 생년월일: YYYY-MM-DD 형식, 범위 검증
- 출생시간: HH:mm 형식
- 출생시간 모름: 체크박스 토글
- 성별: RadioGroup 선택

#### B. 폼 제출
- 필수 항목 미입력 → 버튼 비활성화
- 검증 통과 → 버튼 활성화
- 제출 → createSajuTest() 호출
- 로딩 중 버튼 비활성화

#### C. 구독 기능 통합
- 잔여 횟수 부족 → 구독 유도 다이얼로그
- 구독 상태에 따른 모델 선택 (flash/pro)

#### D. 에러 처리
- API 실패 → 토스트 메시지
- 세션 만료 → 리다이렉트

### 3.2 테스트 코드 구조

```
tests/unit/pages/
└── new-analysis.test.tsx
    ├── "폼 렌더링"
    │   ├── "성함 입력 필드"
    │   ├── "생년월일 입력 필드"
    │   ├── "출생시간 선택/미선택"
    │   ├── "성별 라디오"
    │   └── "제출 버튼"
    │
    ├── "폼 검증"
    │   ├── "성함: 1-50자"
    │   ├── "생년월일: YYYY-MM-DD"
    │   ├── "생년월일: 범위 확인 (1900-현재)"
    │   └── "필수 항목 미입력 → 버튼 비활성화"
    │
    ├── "폼 제출"
    │   ├── "유효한 입력 → 버튼 활성화"
    │   ├── "제출 → createSajuTest 호출"
    │   ├── "로딩 중 버튼 비활성화"
    │   └── "성공 → /dashboard/results/[id] 이동"
    │
    ├── "구독 기능"
    │   ├── "잔여 횟수 부족 → 다이얼로그"
    │   └── "모델 선택: 무료(flash) vs Pro(pro)"
    │
    └── "에러 처리"
        ├── "API 실패 → 토스트"
        └── "다이얼로그 '구독하기' → /subscription 이동"

tests/unit/components/
└── new-analysis-form.test.tsx
    ├── "성함 입력 검증"
    │   ├── "공백 입력"
    │   ├── "51자 이상"
    │   └── "정상 입력"
    │
    ├── "생년월일 검증"
    │   ├── "잘못된 형식"
    │   ├── "미래 날짜"
    │   ├── "1900년 이전"
    │   └── "정상 입력"
    │
    ├── "출생시간 모름 체크박스"
    │   ├── "체크 → 시간 입력 비활성화"
    │   └── "언체크 → 시간 입력 활성화"
    │
    ├── "제출 버튼 상태"
    │   ├── "필수 입력 전 비활성화"
    │   ├── "검증 실패 비활성화"
    │   ├── "로딩 중 비활성화"
    │   └── "검증 통과 활성화"
    │
    └── "에러 메시지"
        ├── "각 필드별 에러 메시지"
        └── "API 에러 토스트"
```

### 3.3 모킹 전략

```typescript
// react-hook-form 통합 테스트
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// createSajuTest Server Action 모킹
jest.mock('@/features/saju/actions/create-saju-test', () => ({
  createSajuTest: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'test-id' },
  }),
}));

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Toast 모킹
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
```

### 3.4 테스트 시나리오

| 테스트 ID | 제목 | AAA 패턴 |
|----------|------|---------|
| NA-01 | 성함 1자 입력 유효 | Arrange: 폼 렌더링 / Act: "김" 입력 / Assert: 에러 없음 |
| NA-02 | 성함 51자 입력 무효 | Arrange: 폼 렌더링 / Act: 51자 입력 / Assert: 에러 메시지 표시 |
| NA-03 | 생년월일 YYYY-MM-DD 유효 | Arrange: 폼 렌더링 / Act: "2000-01-01" 입력 / Assert: 유효 |
| NA-04 | 생년월일 잘못된 형식 무효 | Arrange: 폼 렌더링 / Act: "2000/01/01" 입력 / Assert: 에러 메시지 |
| NA-05 | 미래 날짜 입력 무효 | Arrange: 폼 렌더링 / Act: "2099-12-31" 입력 / Assert: 에러 메시지 |
| NA-06 | 출생시간 모름 체크 → 비활성화 | Arrange: 폼 렌더링 / Act: 체크 / Assert: 시간 입력 disabled |
| NA-07 | 성별 선택 필수 | Arrange: 폼 렌더링 / Act: 성별 미선택 제출 / Assert: 버튼 비활성화 |
| NA-08 | 제출 성공 → 이동 | Arrange: 유효한 입력 / Act: 제출 / Assert: router.push 호출 |
| NA-09 | 잔여 횟수 부족 → 다이얼로그 | Arrange: test_count = 0 / Act: 제출 / Assert: 구독 다이얼로그 표시 |
| NA-10 | API 에러 → 토스트 | Arrange: API 실패 모킹 / Act: 제출 / Assert: 토스트 메시지 표시 |

---

## 4. 사주분석 상세 페이지 (`/dashboard/results/[id]`)

### 4.1 테스트할 주요 기능

#### A. 데이터 조회
- getSajuTest(id) 호출
- 데이터 없음 → 404 처리
- 권한 없음 → 404 처리

#### B. 분석 정보 표시
- 이름, 생년월일, 성별, 분석 날짜 렌더링
- 날짜 포맷팅 (YYYY-MM-DD, 상대시간)
- 모델 정보 뱃지 (flash vs pro)

#### C. 마크다운 렌더링
- AI 분석 결과를 마크다운으로 표시
- XSS 방지 (sanitize 자동)
- 링크 파싱

#### D. 클립보드 복사
- 복사 버튼 클릭 → 결과 복사
- 복사 성공 → "체크" 아이콘, 토스트 메시지
- 복사 실패 → 에러 토스트

#### E. 네비게이션
- "목록으로" 버튼 → /dashboard
- "새 검사하기" 버튼 → /dashboard/new

### 4.2 테스트 코드 구조

```
tests/unit/pages/
└── result-detail.test.tsx
    ├── "페이지 렌더링"
    │   ├── "데이터 조회 후 렌더링"
    │   ├── "데이터 없음 → 404"
    │   └── "권한 없음 → 404"
    │
    ├── "분석 정보 표시"
    │   ├── "이름, 생년월일, 성별 렌더링"
    │   ├── "모델 뱃지: flash vs pro"
    │   ├── "출생시간 포맷팅 (미상 처리)"
    │   └── "분석 날짜 상대시간"
    │
    ├── "마크다운 렌더링"
    │   ├── "결과 텍스트 렌더링"
    │   ├── "제목(h1-h6) 파싱"
    │   ├── "리스트 렌더링"
    │   ├── "링크 파싱"
    │   └── "XSS 방지 (스크립트 제거)"
    │
    ├── "Pro/Free 안내 메시지"
    │   ├── "Pro: 고급 분석 안내"
    │   └── "Free: 기본 분석 안내"
    │
    ├── "클립보드 복사"
    │   ├── "버튼 클릭 → 복사"
    │   ├── "복사 성공 → 토스트"
    │   ├── "복사 실패 → 에러 토스트"
    │   └── "2초 후 아이콘 복구"
    │
    └── "네비게이션"
        ├── "목록으로 → /dashboard"
        └── "새 검사하기 → /dashboard/new"

tests/unit/components/
└── saju/
    ├── analysis-info-card.test.tsx
    │   ├── "정보 렌더링"
    │   ├── "모델 뱃지 표시"
    │   └── "날짜 포맷팅"
    │
    └── analysis-result-section.test.tsx
        ├── "마크다운 렌더링"
        ├── "Pro/Free 안내 메시지"
        └── "클립보드 복사 버튼"
```

### 4.3 모킹 전략

```typescript
// getSajuTest 모킹
jest.mock('@/features/saju/queries/get-saju-test', () => ({
  getSajuTest: jest.fn().mockResolvedValue({
    id: 'test-id',
    name: '홍길동',
    birthDate: '2000-01-01',
    birthTime: '14:30',
    gender: 'male',
    result: '# 분석 결과\n...',
    modelUsed: 'pro',
    createdAt: '2024-01-15T10:00:00Z',
  }),
}));

// notFound 모킹
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// 클립보드 API 모킹
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});
```

### 4.4 테스트 시나리오

| 테스트 ID | 제목 | 입력 | 기대 결과 |
|----------|------|------|---------|
| RD-01 | 분석 정보 렌더링 | 유효한 ID | 이름, 생년월일, 성별 표시 |
| RD-02 | 모델 뱃지: Pro | modelUsed: "pro" | "Pro 고급 분석" 뱃지 + 아이콘 |
| RD-03 | 모델 뱃지: Free | modelUsed: "flash" | "기본 분석" 뱃지 |
| RD-04 | 출생시간 미상 | birthTime: null | "미상" 표시 |
| RD-05 | 마크다운 렌더링 | HTML 결과 | h1-h6, 리스트, 링크 파싱 |
| RD-06 | XSS 방지 | result: '<script>...' | 스크립트 제거, 텍스트만 표시 |
| RD-07 | 복사 성공 | 복사 버튼 클릭 | 토스트 표시, 아이콘 변경 |
| RD-08 | 복사 2초 후 복구 | 복사 후 대기 | 체크 → 복사 아이콘 복구 |
| RD-09 | 목록으로 버튼 | 클릭 | router.push("/dashboard") |
| RD-10 | 데이터 없음 → 404 | 존재 안 함 | notFound() 호출 |

---

## 5. 구독 관리 페이지 (`/subscription`)

### 5.1 테스트할 주요 기능

#### A. 구독 정보 조회
- getSubscription() 호출
- 4가지 상태: free, pro, cancelled, payment_failed
- 상태별 UI 렌더링

#### B. 무료 사용자
- "Pro 구독하기" 버튼 렌더링
- 버튼 클릭 → 토스페이먼츠 SDK 초기화
- 안내 메시지 표시

#### C. Pro 활성 사용자
- "구독 취소" 버튼 렌더링
- 다음 결제일 표시
- 카드 정보 표시

#### D. Pro 취소 예약 사용자
- "구독 재개" 버튼 렌더링
- "취소 예약" 배지 표시
- 다음 결제일까지 혜택 유지 안내

#### E. Pro 결제 실패 사용자
- "결제 재시도" 버튼 렌더링
- "결제 실패" 배지 표시
- 에러 메시지

#### F. 구독 취소/재개 다이얼로그
- 확인 다이얼로그 표시
- cancelSubscription / resumeSubscription 호출
- 성공 → 페이지 새로고침
- 실패 → 에러 토스트

### 5.2 테스트 코드 구조

```
tests/unit/pages/
└── subscription.test.tsx
    ├── "무료 사용자"
    │   ├── "Pro 구독하기 버튼"
    │   ├── "안내 메시지"
    │   └── "구독 정보 비표시"
    │
    ├── "Pro 활성 사용자"
    │   ├── "구독 취소 버튼"
    │   ├── "다음 결제일 표시"
    │   ├── "카드 정보 표시"
    │   └── "구독 상태: Pro"
    │
    ├── "Pro 취소 예약 사용자"
    │   ├── "구독 재개 버튼"
    │   ├── "배지: 취소 예약"
    │   ├── "다음 결제일까지 혜택 유지"
    │   └── "구독 상태: Pro (취소 예약)"
    │
    ├── "Pro 결제 실패 사용자"
    │   ├── "결제 재시도 버튼"
    │   ├── "배지: 결제 실패"
    │   └── "에러 메시지"
    │
    ├── "구독 취소 플로우"
    │   ├── "다이얼로그 표시"
    │   ├── "확인 클릭 → cancelSubscription 호출"
    │   ├── "성공 → refresh()"
    │   └── "실패 → 에러 토스트"
    │
    └── "구독 재개 플로우"
        ├── "다이얼로그 표시"
        ├── "확인 클릭 → resumeSubscription 호출"
        ├── "성공 → refresh()"
        └── "실패 → 에러 토스트"

tests/unit/components/
└── subscription/
    ├── subscription-info.test.tsx
    │   ├── "무료 정보 표시"
    │   ├── "Pro 정보 표시"
    │   ├── "취소 예약 정보 표시"
    │   └── "결제 실패 정보 표시"
    │
    ├── subscribe-button.test.tsx
    │   ├── "토스페이먼츠 SDK 초기화"
    │   ├── "카드 등록 요청"
    │   └── "로딩 상태"
    │
    ├── cancel-dialog.test.tsx
    │   ├── "다이얼로그 렌더링"
    │   ├── "확인 클릭 → cancelSubscription"
    │   └── "취소 클릭 → 다이얼로그 닫음"
    │
    └── resume-dialog.test.tsx
        ├── "다이얼로그 렌더링"
        ├── "확인 클릭 → resumeSubscription"
        └── "취소 클릭 → 다이얼로그 닫음"
```

### 5.3 모킹 전략

```typescript
// getSubscription 모킹
jest.mock('@/features/subscription/queries/get-subscription', () => ({
  getSubscription: jest.fn().mockResolvedValue({
    userEmail: 'user@example.com',
    status: 'pro',
    testCount: 5,
    nextBillingDate: '2024-11-30',
    cardNumber: '1234',
    cardCompany: 'VISA',
  }),
}));

// cancelSubscription 모킹
jest.mock('@/features/subscription/actions/cancel-subscription', () => ({
  cancelSubscription: jest.fn().mockResolvedValue({
    success: true,
  }),
}));

// resumeSubscription 모킹
jest.mock('@/features/subscription/actions/resume-subscription', () => ({
  resumeSubscription: jest.fn().mockResolvedValue({
    success: true,
  }),
}));

// Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));
```

### 5.4 테스트 시나리오

| 테스트 ID | 제목 | 전제 | 기대 결과 |
|----------|------|------|---------|
| SUB-01 | 무료 사용자 정보 | status: free | "Pro 구독하기" 버튼 표시 |
| SUB-02 | Pro 활성 정보 | status: pro | "구독 취소" 버튼, 다음 결제일 표시 |
| SUB-03 | Pro 취소 예약 정보 | status: cancelled | "구독 재개" 버튼, 배지 표시 |
| SUB-04 | Pro 결제 실패 정보 | status: payment_failed | "결제 재시도" 버튼, 배지 표시 |
| SUB-05 | 구독 취소 다이얼로그 | "구독 취소" 클릭 | AlertDialog 표시 |
| SUB-06 | 구독 취소 확인 | 다이얼로그 확인 | cancelSubscription 호출 |
| SUB-07 | 구독 취소 성공 | 호출 성공 | refresh() 호출 |
| SUB-08 | 구독 취소 실패 | 호출 실패 | 에러 토스트 표시 |
| SUB-09 | 구독 재개 다이얼로그 | "구독 재개" 클릭 | AlertDialog 표시 |
| SUB-10 | 구독 재개 확인 | 다이얼로그 확인 | resumeSubscription 호출 |

---

## 6. 공통 유틸리티 및 함수 테스트

### 6.1 검증 함수

```
tests/unit/lib/
├── utils/
│   ├── date.test.ts
│   │   ├── "formatDate(YYYY-MM-DD)"
│   │   ├── "formatDateTime (상대시간)"
│   │   └── "parseDate 역파싱"
│   │
│   ├── clipboard.test.ts
│   │   ├── "copyToClipboard 성공"
│   │   └── "copyToClipboard 실패 (폴백)"
│   │
│   └── validation.test.ts
│       ├── "isValidEmail"
│       ├── "isValidDate (범위 확인)"
│       └── "isValidBirthDate"
│
└── supabase/
    ├── server-client.test.ts
    │   └── "Supabase Client 초기화"
    │
    └── types.test.ts
        └── "타입 호환성"
```

### 6.2 테스트 예시

```typescript
// date.test.ts
describe('Date Utils', () => {
  it('formatDate should format YYYY-MM-DD correctly', () => {
    const result = formatDate('2000-01-15', 'yyyy-MM-dd');
    expect(result).toBe('2000-01-15');
  });

  it('formatDateTime should show relative time for recent dates', () => {
    const now = new Date();
    const result = formatDateTime(now.toISOString());
    expect(result).toContain('방금 전');
  });
});

// validation.test.ts
describe('Validation Utils', () => {
  it('isValidEmail should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('isValidEmail should return false for invalid email', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

---

## 7. 테스트 구조 및 파일 레이아웃

### 7.1 디렉토리 구조

```
tests/
├── unit/
│   ├── pages/
│   │   ├── home.test.tsx
│   │   ├── dashboard.test.tsx
│   │   ├── new-analysis.test.tsx
│   │   ├── result-detail.test.tsx
│   │   └── subscription.test.tsx
│   │
│   ├── components/
│   │   └── saju/
│   │       ├── search-bar.test.tsx
│   │       ├── saju-test-card.test.tsx
│   │       ├── load-more-button.test.tsx
│   │       ├── analysis-info-card.test.tsx
│   │       └── analysis-result-section.test.tsx
│   │
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── date.test.ts
│   │   │   ├── clipboard.test.ts
│   │   │   └── validation.test.ts
│   │   │
│   │   └── supabase/
│   │       └── server-client.test.ts
│   │
│   └── setup.ts (Jest 설정)
│
├── e2e/ (추후)
│   └── ...
│
└── mocks/
    ├── handlers.ts
    └── server.ts
```

### 7.2 Jest 설정 (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // 컴포넌트 테스트용
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/tests/unit/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
};
```

### 7.3 테스트 설정 (setup.ts)

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock 전역 설정
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

## 8. 테스트 작성 가이드라인

### 8.1 AAA 패턴 (Arrange-Act-Assert)

```typescript
describe('Component', () => {
  it('should do something', () => {
    // Arrange: 테스트 환경 설정
    const mockData = { name: '홍길동', birthDate: '2000-01-01' };
    const { getByText } = render(<Component data={mockData} />);

    // Act: 사용자 인터랙션 또는 함수 실행
    const button = getByText('검사하기');
    fireEvent.click(button);

    // Assert: 기대 결과 확인
    expect(getByText('분석 중입니다')).toBeInTheDocument();
  });
});
```

### 8.2 테스트 명명 규칙

```
✅ 좋음:
- "should render all sections on home page"
- "should disable button when form is invalid"
- "should call createSajuTest when user submits form"

❌ 나쁨:
- "test 1"
- "home page works"
- "button test"
```

### 8.3 모킹 원칙

```typescript
// ✅ 좋음: 구체적인 모킹
jest.mock('@/features/saju/actions/create-saju-test', () => ({
  createSajuTest: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'test-123' },
  }),
}));

// ❌ 나쁨: 전체 모듈 모킹
jest.mock('@/features/saju');
```

### 8.4 테스트 격리

```typescript
// ✅ 좋음: 각 테스트 독립적
describe('SearchBar', () => {
  it('should filter by name A', () => {
    const { getByDisplayValue } = render(<SearchBar />);
    fireEvent.change(getByDisplayValue(''), { target: { value: '홍길동' } });
    expect(getByDisplayValue('홍길동')).toBeInTheDocument();
  });

  it('should filter by name B', () => {
    const { getByDisplayValue } = render(<SearchBar />); // 새로 렌더링
    fireEvent.change(getByDisplayValue(''), { target: { value: '김유신' } });
    expect(getByDisplayValue('김유신')).toBeInTheDocument();
  });
});

// ❌ 나쁨: 테스트 간 의존성
let component;
beforeAll(() => {
  component = render(<SearchBar />); // 한 번만 렌더링
});
```

---

## 9. 커버리지 목표

### 9.1 페이지별 커버리지

| 페이지 | 라인 커버리지 | 분기 커버리지 | 함수 커버리지 |
|--------|-------------|------------|-------------|
| 홈 페이지 | 80% | 70% | 85% |
| 대시보드 | 85% | 75% | 90% |
| 새 분석 | 90% | 85% | 95% |
| 상세 페이지 | 80% | 70% | 85% |
| 구독 | 85% | 75% | 90% |
| 유틸리티 | 95% | 90% | 100% |

### 9.2 전체 목표

- **전체 라인 커버리지**: 80% 이상
- **핵심 기능 분기 커버리지**: 75% 이상
- **유틸리티 함수**: 100% (가능한 범위)

---

## 10. 구현 일정

### 10.1 페이즈별 일정

| 페이즈 | 담당 | 예상 시간 | 우선순위 |
|--------|------|---------|---------|
| Phase 1: 홈 페이지 테스트 | - | 2시간 | P0 |
| Phase 2: 대시보드 테스트 | - | 3시간 | P0 |
| Phase 3: 새 분석 테스트 | - | 3시간 | P0 |
| Phase 4: 상세 페이지 테스트 | - | 2시간 | P1 |
| Phase 5: 구독 테스트 | - | 3시간 | P1 |
| Phase 6: 유틸리티 테스트 | - | 2시간 | P1 |
| Phase 7: CI/CD 통합 | - | 1시간 | P2 |
| **총 예상 시간** | | **16시간** | |

### 10.2 마일스톤

1. **M1 (2-3일)**: 홈, 대시보드, 새 분석 페이지 테스트 (8시간)
2. **M2 (1-2일)**: 상세 페이지, 구독 페이지, 유틸리티 테스트 (7시간)
3. **M3 (0.5일)**: CI/CD 통합 및 커버리지 검증 (1시간)

---

## 11. 주의사항

### 11.1 TDD 원칙 준수

- **테스트 먼저 작성**: 코드 작성 전 테스트 케이스 정의
- **최소 구현**: 테스트 통과에 필요한 최소 코드만 작성
- **리팩토링**: 모든 테스트가 통과 후 코드 정리

### 11.2 테스트 품질

- **명확한 테스트명**: "should" 패턴 사용
- **독립적 테스트**: 테스트 간 의존성 제거
- **빠른 실행**: 각 테스트 < 100ms
- **안정적 테스트**: 플래키(flaky) 테스트 제거

### 11.3 모킹 최소화

- **실제 동작 테스트**: 외부 API는 모킹, 비즈니스 로직은 실제 코드
- **마이크로 모킹**: 필요한 부분만 모킹 (전체 모듈 X)
- **명확한 모킹**: 모킹 의도가 분명한 코드

### 11.4 문서화

- **테스트 코드도 문서**: 테스트명으로 스펙 문서화
- **복잡한 로직 주석**: 이해하기 어려운 부분에만 주석
- **변경 사항 반영**: 기능 변경 시 테스트도 함께 수정

---

## 12. 다음 단계

1. **Phase 1 시작**: 홈 페이지 테스트부터 시작
2. **매일 TDD 프로세스**: Red → Green → Refactor 반복
3. **리뷰 및 피드백**: 각 Phase 완료 후 코드 리뷰
4. **커버리지 모니터링**: 지속적으로 커버리지 확인
5. **CI/CD 연동**: 모든 PR에 테스트 실행 자동화

---

## 문서 정보

- **작성일**: 2025-10-30
- **버전**: 1.0
- **작성자**: Claude Code
- **상태**: 초안 완료 (구현 준비)

