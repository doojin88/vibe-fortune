# 테스트  계획서 

## 테스트  계획 개요:

MVP 개발 가속화를 위한 단위/E2E 테스트 환경 구축을 제안합니다. Supabase 기반의 데이터베이스 스키마를 사용하는 백엔드 로직에 초점을 맞추어, 간결하면서도 효과적인 테스트 환경을 구축할 것입니다.

**핵심 전략:**

*   **단위 테스트:** Jest를 사용하여 백엔드 비즈니스 로직 및 유틸리티 함수를 테스트합니다. 데이터베이스 의존성은 모킹하여 빠른 실행과 격리된 테스트를 보장합니다.
*   **E2E 테스트:** Playwright를 활용하여 Supabase 인스턴스에 직접 연결, 실제 데이터베이스 상호작용을 포함한 전체 사용자 흐름을 검증합니다. 별도의 테스트용 Supabase 프로젝트를 구성하여 개발 환경과의 격리를 유지합니다.

**예상되는 장점:**

*   **개발 속도 향상:** 변경사항에 대한 빠른 피드백을 통해 버그를 조기에 발견하고 수정 시간을 단축합니다.
*   **코드 품질 향상:** 견고한 테스트 스위트는 리팩토링 및 기능 추가 시 안정성을 확보합니다.
*   **안정적인 배포:** 실제 환경과 유사한 E2E 테스트를 통해 배포 전 시스템의 안정성을 검증합니다.
*   **간결한 구성:** 최소한의 라이브러리 사용으로 오버헤드를 줄이고, 유지보수를 용이하게 합니다.

**예상되는 한계점:**

*   **Supabase E2E 환경 관리:** 테스트용 Supabase 인스턴스의 생성 및 초기화 과정이 필요하며, 이는 CI/CD 파이프라인에 통합되어야 합니다.
*   **초기 학습 곡선:** Playwright 및 Supabase CLI를 활용한 테스트 스크립트 작성에 대한 초기 학습 시간이 필요할 수 있습니다.
*   **테스트 데이터 관리:** E2E 테스트를 위한 일관된 테스트 데이터 관리 전략이 요구됩니다.

---

## 자세한 내용:

MVP 개발 속도에 최적화된 테스트 환경 구축을 위해 다음과 같은 기술 스택과 구현 계획을 수립했습니다.

### 1. 기술 스택 및 라이브러리 결정

우리 프로젝트는 Supabase를 백엔드로 사용하며, 주로 데이터베이스 스키마 및 관련 로직에 대한 검증이 중요합니다. 따라서 백엔드 로직에 집중하고, 프론트엔드/API 게이트웨이 등의 다른 레이어는 MVP 단계에서는 추후 고려하도록 합니다.

#### 1.1. 단위 테스트 (Unit Test)

*   **기술 스택/라이브러리:** `Jest`
    *   **선정 이유:**
        *   **광범위한 사용:** JavaScript/TypeScript 프로젝트에서 가장 널리 사용되는 테스트 프레임워크 중 하나로, 풍부한 문서와 커뮤니티 지원을 자랑합니다.
        *   **빠른 실행:** 가상 DOM 환경에서 작동하며, Watch 모드를 제공하여 개발 중 빠른 피드백이 가능합니다. 이는 신속한 개발 iteration에 필수적입니다.
        *   **간결한 API:** 쉬운 학습 곡선과 직관적인 API를 제공하여 테스트 코드 작성에 드는 시간을 최소화합니다.
        *   **모킹 기능:** 모킹 기능을 내장하고 있어 데이터베이스와 같은 외부 의존성을 쉽게 격리하여 테스트할 수 있습니다. 이는 "오버엔지니어링을 피해 당장 해야만 하는 작업만 수행"이라는 목표에 부합합니다.

#### 1.2. E2E 테스트 (End-to-End Test)

*   **기술 스택/라이브러리:** `Playwright` + `Supabase CLI`
    *   **선정 이유:**
        *   **Supabase와의 통합 용이성:** Supabase CLI를 사용하여 로컬 또는 원격 Supabase 프로젝트에 직접 접근하고 데이터베이스를 제어할 수 있습니다. 이를 통해 실제 데이터베이스 상호작용을 검증하는 E2E 테스트가 가능합니다.
        *   **넓은 지원 범위:** Node.js 기반으로 JavaScript/TypeScript를 지원하며, 브라우저 자동화 기능도 뛰어나 향후 프론트엔드 통합 시 확장성을 제공합니다.
        *   **견고성 및 신뢰성:** 자동 대기(auto-waiting) 기능으로 인해 테스트가 플래키(flaky)해지는 현상이 적습니다.
        *   **테스트 환경 격리:** `Supabase CLI`를 사용하여 테스트 전/후로 데이터베이스 스키마를 초기화하거나 특정 마이그레이션을 적용할 수 있습니다. 이를 통해 개발 환경에 영향을 주지 않는 독립적인 E2E 테스트 환경을 구축할 수 있습니다.

### 2. 구현 계획

#### 2.1. 프로젝트 구조

```
./
├── supabase/
│   └── migrations/
│       └── ...
├── src/
│   └── services/
│       └── userService.ts // 예시 비즈니스 로직
│   └── utils/
│       └── validation.ts   // 예시 유틸리티 함수
├── tests/
│   ├── unit/
│   │   └── userService.test.ts
│   │   └── validation.test.ts
│   └── e2e/
│       └── sajuTestFlow.test.ts
├── jest.config.js
├── playwright.config.ts
└── package.json
```

#### 2.2. 단위 테스트 환경 구축 (Jest)

1.  **설치:**
    ```bash
    npm install --save-dev jest @types/jest ts-jest
    ```
2.  **`jest.config.js` 설정:**
    ```javascript
    /** @type {import('ts-jest').JestConfigWithTsJest} */
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'], // 단위 테스트 파일 경로 지정
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // src 폴더에 대한 alias 설정 (선택 사항)
      },
    };
    ```
3.  **`package.json` 스크립트 추가:**
    ```json
    {
      "scripts": {
        "test:unit": "jest --config jest.config.js"
      }
    }
    ```
4.  **간단한 단위 테스트 예시 (`tests/unit/validation.test.ts`):**

    `src/utils/validation.ts` (예시)
    ```typescript
    export function isValidEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    export function isPositiveNumber(num: number): boolean {
      return num > 0;
    }
    ```

    `tests/unit/validation.test.ts`
    ```typescript
    import { isValidEmail, isPositiveNumber } from '../../src/utils/validation';
    
    describe('Validation Utils', () => {
      it('should return true for a valid email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
      });
    
      it('should return false for an invalid email', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
      });
    
      it('should return true for a positive number', () => {
        expect(isPositiveNumber(10)).toBe(true);
      });
    
      it('should return false for a non-positive number', () => {
        expect(isPositiveNumber(-5)).toBe(false);
      });
    });
    ```

#### 2.3. E2E 테스트 환경 구축 (Playwright + Supabase CLI)

1.  **설치:**
    ```bash
    npm install --save-dev @playwright/test @supabase/supabase-js dotenv
    # Supabase CLI는 별도로 설치 권장 (brew install supabase/supabase/supabase)
    ```
2.  **`playwright.config.ts` 설정:**
    ```typescript
    import { defineConfig, devices } from '@playwright/test';
    import dotenv from 'dotenv';
    import * as path from 'path';
    
    dotenv.config({ path: path.resolve(__dirname, '.env.test') });
    
    export default defineConfig({
      testDir: './tests/e2e',
      fullyParallel: true,
      forbidOnly: !!process.env.CI,
      retries: process.env.CI ? 2 : 0,
      workers: process.env.CI ? 1 : undefined,
      reporter: 'html',
      use: {
        baseURL: process.env.SUPABASE_URL, // Supabase 프로젝트 URL
        trace: 'on-first-retry',
      },
      projects: [
        {
          name: 'supabase-e2e',
          testMatch: /.*\.test\.ts$/,
          use: { ...devices['Desktop Chrome'] }, // 브라우저 테스트도 가능하지만, 현재는 API 테스트에 중점
        },
      ],
      globalSetup: require.resolve('./tests/e2e/global-setup'), // 테스트 시작 전 설정
      globalTeardown: require.resolve('./tests/e2e/global-teardown'), // 테스트 종료 후 설정
    });
    ```
3.  **환경 변수 (`.env.test`):**
    `SUPABASE_URL` 및 `SUPABASE_ANON_KEY`는 테스트용 Supabase 프로젝트의 정보를 사용합니다.
    (예: 로컬 Supabase 에뮬레이터 또는 별도 테스트 환경용 Supabase 프로젝트)
    ```
    SUPABASE_URL=http://localhost:54321
    SUPABASE_ANON_KEY=eyJ...
    SUPABASE_SERVICE_ROLE_KEY=eyJ...
    SUPABASE_DB_URL=postgresql://postgres:supabase@localhost:54322/postgres
    ```
4.  **Global Setup/Teardown 설정 (`tests/e2e/global-setup.ts`, `tests/e2e/global-teardown.ts`):**
    이 부분은 "가장 쉬운 인프라를 지향"하는 가치에 따라, 로컬 Supabase 환경을 활용하는 방향으로 구성합니다. CI/CD 환경에서는 별도의 원격 Supabase 프로젝트를 생성하고 해당 정보를 환경 변수로 주입하는 방식으로 확장할 수 있습니다.

    `tests/e2e/global-setup.ts`
    ```typescript
    import { FullConfig } from '@playwright/test';
    import { execSync } from 'child_process';
    import dotenv from 'dotenv';
    import * as path from 'path';
    
    async function globalSetup(config: FullConfig) {
      dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
      console.log('--- E2E Global Setup: Starting Supabase services ---');
      try {
        // 로컬 Supabase 에뮬레이터 시작
        execSync('supabase start', { stdio: 'inherit' });
        // 데이터베이스 초기화 및 마이그레이션 적용
        // 주의: 이 명령어는 .env.test에 설정된 SUPABASE_DB_URL을 사용합니다.
        execSync('supabase db reset --local', { stdio: 'inherit' }); // 모든 마이그레이션 적용 및 데이터 초기화
        console.log('--- Supabase services started and database reset ---');
      } catch (error) {
        console.error('--- Failed to start Supabase or reset database: ---', error);
        process.exit(1);
      }
    }
    
    export default globalSetup;
    ```

    `tests/e2e/global-teardown.ts`
    ```typescript
    import { FullConfig } from '@playwright/test';
    import { execSync } from 'child_process';
    
    async function globalTeardown(config: FullConfig) {
      console.log('--- E2E Global Teardown: Stopping Supabase services ---');
      try {
        execSync('supabase stop', { stdio: 'inherit' });
        console.log('--- Supabase services stopped ---');
      } catch (error) {
        console.error('--- Failed to stop Supabase: ---', error);
      }
    }
    
    export default globalTeardown;
    ```
5.  **`package.json` 스크립트 추가:**
    ```json
    {
      "scripts": {
        "test:e2e": "playwright test"
      }
    }
    ```
6.  **간단한 E2E 테스트 예시 (`tests/e2e/sajuTestFlow.test.ts`):**

    ```typescript
    import { test, expect } from '@playwright/test';
    import { createClient } from '@supabase/supabase-js';
    import dotenv from 'dotenv';
    import * as path from 'path';
    
    // .env.test 파일 로드
    dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
    
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    test.describe('Saju Test Flow E2E', () => {
      // 각 테스트 전 데이터베이스 클린업 (선택 사항, global-setup에서 전체 리셋하므로 중복될 수 있음)
      test.beforeEach(async () => {
        // 모든 사용자 및 사주 테스트 데이터를 삭제하여 독립적인 테스트 환경 보장
        await supabase.from('saju_tests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('users').delete().neq('id', '0'); // '0'은 존재하지 않는 ID로 가정
      });
    
      test('should allow a user to create a saju test and check count', async () => {
        // 1. 사용자 생성
        const userId = 'e2e-test-user-1';
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: 'e2e@example.com',
            name: 'E2E Test User',
            subscription_status: 'free',
            test_count: 3,
          })
          .select()
          .single();
    
        expect(userError).toBeNull();
        expect(userData).toBeDefined();
        expect(userData?.id).toBe(userId);
        expect(userData?.test_count).toBe(3);
    
        // 2. 사주 테스트 생성
        const { data: sajuData, error: sajuError } = await supabase
          .from('saju_tests')
          .insert({
            user_id: userId,
            name: '홍길동',
            birth_date: '1990-01-01',
            gender: 'male',
            result: '테스트 결과입니다.',
            model_used: 'flash',
          })
          .select()
          .single();
    
        expect(sajuError).toBeNull();
        expect(sajuData).toBeDefined();
        expect(sajuData?.user_id).toBe(userId);
        expect(sajuData?.name).toBe('홍길동');
    
        // 3. 사용자 잔여 검사 횟수 확인 (비즈니스 로직에 따라 감소했는지 확인)
        // 실제 백엔드 API가 있다면 API 호출로 검증하겠지만, 지금은 DB 직접 접근으로 검증
        const { data: updatedUserData, error: updatedUserError } = await supabase
          .from('users')
          .select('test_count')
          .eq('id', userId)
          .single();
    
        expect(updatedUserError).toBeNull();
        expect(updatedUserData?.test_count).toBe(2); // 무료 사용자는 1회 사용 시 2로 감소
      });
    });
    ```

    `테스트 설명`:
    *   `global-setup.ts`에서 Supabase 로컬 인스턴스를 시작하고 `db reset --local`을 통해 모든 마이그레이션을 적용하여 깨끗한 상태로 만듭니다.
    *   `sajuTestFlow.test.ts`에서는 `supabase-js` 클라이언트를 사용하여 직접 데이터베이스에 접속합니다.
    *   `test.beforeEach`를 통해 각 테스트 전에 데이터를 클린업하여 테스트 간의 독립성을 보장합니다.
    *   사용자를 생성하고, 사주 테스트를 생성한 후, 사용자 테이블의 `test_count`가 비즈니스 로직에 따라 올바르게 감소했는지 검증합니다. (여기서는 백엔드 비즈니스 로직이 `test_count`를 감소시키는 트리거 또는 함수가 있다고 가정)
    *   현재 백엔드 로직이 Supabase Function으로 구현되었다면, Playwright에서 해당 Function을 직접 호출하거나, API Gateway가 있다면 그 API를 호출하여 테스트할 수 있습니다. `supabase-js` 클라이언트를 사용하는 방식은 데이터베이스 직접 상호작용에 중점을 둔 간결한 E2E 테스트 예시입니다.
