# Google Gemini API 가이드

## 개요
Google Gemini API를 사용한 가이드

---

## 1. 필수 패키지 설치

```bash
npm install @google/genai
```

**주요 패키지**:

- `@google/genai`: Google Gemini API 공식 최신 SDK (Node.js v18+ 필요)

---

## 2. 환경 변수 설정

### 2.1 환경 변수 설정

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

**보안 주의사항**:

- API 키는 서버 환경 변수에만 저장
- 환경 변수명은 반드시 `GEMINI_API_KEY`로 설정 (SDK가 자동으로 인식)
- 클라이언트 코드에 노출 금지
- Git 저장소에 커밋 금지

---

## 3. 기본 설정 및 초기화

### 3.1 Gemini 클라이언트 초기화

**파일**: `src/lib/gemini/client.ts`

```typescript
import { GoogleGenAI } from '@google/genai';

// 환경 변수 GEMINI_API_KEY를 자동으로 인식
const ai = new GoogleGenAI({});

export { ai };
```

### 3.2 기본 텍스트 생성 예시

```typescript
import { ai } from '@/lib/gemini/client';

async function generateText() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });

  console.log(response.text);
}
```

### 3.3 고급 설정 옵션 (Config)

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Explain how AI works",
  config: {
    systemInstruction: "You are a helpful AI assistant.",
    temperature: 0.7,        // 창의성 수준 (0.0-1.0)
    maxOutputTokens: 2048,   // 최대 출력 토큰 수
    thinkingConfig: {
      thinkingBudget: 0,     // Thinking 비활성화 (2.5 모델 전용)
    },
  },
});
```

**주요 설정**:
- `systemInstruction`: 시스템 프롬프트 (모델 행동 가이드)
- `temperature`: 창의성 수준 (낮을수록 일관성 높음)
- `maxOutputTokens`: 최대 응답 길이
- `thinkingConfig`: Gemini 2.5 모델의 사고 과정 제어

---

## 4. 사주분석 프롬프트 설계

### 4.1 기본 프롬프트 템플릿

**파일**: `src/features/fortune/constants/prompts.ts`

```typescript
export const FORTUNE_ANALYSIS_PROMPT = `
당신은 전문 사주명리학자입니다. 주어진 생년월일시 정보를 바탕으로 정확하고 상세한 사주분석을 제공해주세요.

## 입력 정보
- 이름: {name}
- 생년월일: {birthDate}
- 출생시간: {birthTime}
- 성별: {gender}

## 분석 요구사항
다음 항목들을 포함하여 JSON 형태로 응답해주세요:

1. **천간지지 분석**
   - 년주, 월주, 일주, 시주의 천간과 지지
   - 각 주의 의미와 특성

2. **오행 분석**
   - 목, 화, 토, 금, 수의 균형
   - 부족하거나 과다한 오행
   - 오행 상생상극 관계

3. **대운과 세운**
   - 현재 대운의 특성
   - 올해 세운의 운세
   - 향후 5년간의 운세 전망

4. **종합 운세**
   - 성격 분석
   - 재운 (재물운)
   - 건강운
   - 연애운/결혼운

## 응답 형식
반드시 다음 JSON 구조로 응답해주세요:

\`\`\`json
{
  "heavenlyStems": {
    "year": "갑",
    "month": "을", 
    "day": "병",
    "hour": "정"
  },
  "earthlyBranches": {
    "year": "자",
    "month": "축",
    "day": "인", 
    "hour": "묘"
  },
  "fiveElements": {
    "wood": 2,
    "fire": 3,
    "earth": 1,
    "metal": 1,
    "water": 1,
    "analysis": "화가 가장 많고..."
  },
  "fortune": {
    "personality": "성격 분석 내용...",
    "wealth": "재운 분석 내용...",
    "health": "건강운 분석 내용...",
    "love": "연애운 분석 내용..."
  },
  "future": {
    "currentPeriod": "현재 대운 분석...",
    "thisYear": "올해 운세...",
    "nextFiveYears": "향후 5년 전망..."
  }
}
\`\`\`

분석은 전통 사주명리학 이론에 기반하여 정확하고 구체적으로 작성해주세요.
`;
```

### 4.2 고급 분석 프롬프트 (Pro 사용자용)

```typescript
export const ADVANCED_FORTUNE_PROMPT = `
당신은 30년 경력의 전문 사주명리학자입니다. {name}님의 사주를 깊이 있게 분석해주세요.

## 상세 분석 요구사항

1. **사주팔자 상세 분석**
   - 십이신살 분석
   - 신살과 길흉
   - 궁합 분석 (배우자, 가족, 직장 동료)

2. **직업운과 사업운**
   - 적합한 직업 분야
   - 사업 성공 가능성
   - 투자 및 재테크 조언

3. **건강 관리**
   - 주의해야 할 질병
   - 건강 관리 방법
   - 운동 및 식단 조언

4. **인간관계**
   - 궁합이 좋은 사람들
   - 주의해야 할 관계
   - 소통 방법 조언

5. **시기별 운세**
   - 월별 운세
   - 계절별 주의사항
   - 길일과 흉일

## 응답 형식
\`\`\`json
{
  "detailedAnalysis": {
    "twelveGods": "십이신살 분석...",
    "compatibility": "궁합 분석...",
    "career": "직업운 분석...",
    "health": "건강 관리...",
    "relationships": "인간관계...",
    "timing": "시기별 운세..."
  }
}
\`\`\`
`;
```

---

## 5. 사주분석 서비스 구현

### 5.1 사주분석 요청 스키마

**파일**: `src/features/fortune/backend/schema.ts`

```typescript
import { z } from 'zod';

export const FortuneAnalysisRequestSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  birthTime: z.string().optional(),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: '성별을 선택해주세요' })
  }),
  isPro: z.boolean().default(false),
});

export const FortuneAnalysisResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthDate: z.string(),
  birthTime: z.string().optional(),
  gender: z.string(),
  analysisResult: z.object({
    heavenlyStems: z.object({
      year: z.string(),
      month: z.string(),
      day: z.string(),
      hour: z.string(),
    }),
    earthlyBranches: z.object({
      year: z.string(),
      month: z.string(),
      day: z.string(),
      hour: z.string(),
    }),
    fiveElements: z.object({
      wood: z.number(),
      fire: z.number(),
      earth: z.number(),
      metal: z.number(),
      water: z.number(),
      analysis: z.string(),
    }),
    fortune: z.object({
      personality: z.string(),
      wealth: z.string(),
      health: z.string(),
      love: z.string(),
    }),
    future: z.object({
      currentPeriod: z.string(),
      thisYear: z.string(),
      nextFiveYears: z.string(),
    }),
  }),
  createdAt: z.string(),
});

export type FortuneAnalysisRequest = z.infer<typeof FortuneAnalysisRequestSchema>;
export type FortuneAnalysisResponse = z.infer<typeof FortuneAnalysisResponseSchema>;
```

### 5.2 Gemini API 호출 서비스

**파일**: `src/features/fortune/backend/service.ts`

```typescript
import { ai } from '@/lib/gemini/client';
import { FORTUNE_ANALYSIS_PROMPT, ADVANCED_FORTUNE_PROMPT } from '../constants/prompts';
import { FortuneAnalysisRequest } from './schema';

export class FortuneAnalysisService {
  async analyzeFortune(request: FortuneAnalysisRequest) {
    try {
      // 모델 선택 (Pro 사용자는 Pro 모델, 무료 사용자는 Flash 모델)
      const model = request.isPro ? "gemini-2.5-pro" : "gemini-2.5-flash";

      // 프롬프트 선택
      const prompt = request.isPro
        ? ADVANCED_FORTUNE_PROMPT
        : FORTUNE_ANALYSIS_PROMPT;

      // 프롬프트에 사용자 정보 삽입
      const formattedPrompt = prompt
        .replace('{name}', request.name)
        .replace('{birthDate}', request.birthDate)
        .replace('{birthTime}', request.birthTime || '미상')
        .replace('{gender}', request.gender === 'male' ? '남성' : '여성');

      // Gemini API 호출 (최신 SDK)
      const response = await ai.models.generateContent({
        model,
        contents: formattedPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          thinkingConfig: {
            thinkingBudget: 0, // Thinking 비활성화로 응답 속도 향상
          },
        },
      });

      const analysisText = response.text;

      // JSON 파싱 및 검증
      const analysisResult = this.parseAnalysisResult(analysisText);

      return {
        success: true,
        data: analysisResult,
      };
    } catch (error) {
      console.error('사주분석 오류:', error);
      return {
        success: false,
        error: '사주분석 중 오류가 발생했습니다.',
      };
    }
  }

  private parseAnalysisResult(analysisText: string) {
    try {
      // JSON 블록 추출
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }

      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString);

      // 기본 검증
      if (!parsed.heavenlyStems || !parsed.earthlyBranches) {
        throw new Error('필수 분석 결과가 누락되었습니다.');
      }

      return parsed;
    } catch (error) {
      console.error('분석 결과 파싱 오류:', error);
      throw new Error('분석 결과를 처리할 수 없습니다.');
    }
  }
}
```

### 5.3 API 라우터 구현

**파일**: `src/features/fortune/backend/route.ts`

```typescript
import { Hono } from 'hono';
import { FortuneAnalysisService } from './service';
import { FortuneAnalysisRequestSchema } from './schema';
import { success, failure } from '@/backend/http/response';

const fortuneService = new FortuneAnalysisService();

export const fortuneRoutes = new Hono()
  .post('/analyze', async (c) => {
    try {
      // 요청 데이터 검증
      const body = await c.req.json();
      const validatedData = FortuneAnalysisRequestSchema.parse(body);

      // 사용자 인증 확인
      const { userId } = c.get('user');
      if (!userId) {
        return c.json(failure('인증이 필요합니다.'), 401);
      }

      // 분석 횟수 확인
      const remainingCount = await checkRemainingAnalysisCount(userId);
      if (remainingCount <= 0) {
        return c.json(failure('분석 횟수가 부족합니다. 구독을 확인해주세요.'), 400);
      }

      // 사주분석 실행
      const result = await fortuneService.analyzeFortune(validatedData);
      
      if (!result.success) {
        return c.json(failure(result.error), 500);
      }

      // 분석 결과 저장
      const savedAnalysis = await saveAnalysisResult(userId, validatedData, result.data);
      
      // 분석 횟수 차감
      await decrementAnalysisCount(userId);

      return c.json(success(savedAnalysis));
    } catch (error) {
      console.error('사주분석 API 오류:', error);
      return c.json(failure('서버 오류가 발생했습니다.'), 500);
    }
  });
```

---

## 6. 프론트엔드 연동

### 6.1 사주분석 훅

**파일**: `src/features/fortune/hooks/useFortuneAnalysis.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { FortuneAnalysisRequest, FortuneAnalysisResponse } from '../lib/dto';

export const useFortuneAnalysis = () => {
  return useMutation({
    mutationFn: async (data: FortuneAnalysisRequest): Promise<FortuneAnalysisResponse> => {
      const response = await apiClient.post('/fortune/analyze', data);
      return response.data;
    },
    onError: (error) => {
      console.error('사주분석 오류:', error);
    },
  });
};
```

### 6.2 사주분석 폼 컴포넌트

**파일**: `src/features/fortune/components/FortuneAnalysisForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FortuneAnalysisRequestSchema } from '../lib/dto';
import { useFortuneAnalysis } from '../hooks/useFortuneAnalysis';

export const FortuneAnalysisForm = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fortuneAnalysis = useFortuneAnalysis();

  const form = useForm<FortuneAnalysisRequest>({
    resolver: zodResolver(FortuneAnalysisRequestSchema),
    defaultValues: {
      name: '',
      birthDate: '',
      birthTime: '',
      gender: 'male',
      isPro: false,
    },
  });

  const onSubmit = async (data: FortuneAnalysisRequest) => {
    setIsAnalyzing(true);
    try {
      const result = await fortuneAnalysis.mutateAsync(data);
      // 분석 결과 페이지로 이동
      window.location.href = `/fortune/result/${result.id}`;
    } catch (error) {
      console.error('분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          성함
        </label>
        <input
          {...form.register('name')}
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="이름을 입력해주세요"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium">
          생년월일
        </label>
        <input
          {...form.register('birthDate')}
          type="date"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {form.formState.errors.birthDate && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.birthDate.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="birthTime" className="block text-sm font-medium">
          출생시간 (선택)
        </label>
        <input
          {...form.register('birthTime')}
          type="time"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">성별</label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              {...form.register('gender')}
              type="radio"
              value="male"
              className="form-radio"
            />
            <span className="ml-2">남성</span>
          </label>
          <label className="inline-flex items-center">
            <input
              {...form.register('gender')}
              type="radio"
              value="female"
              className="form-radio"
            />
            <span className="ml-2">여성</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isAnalyzing || !form.formState.isValid}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
      >
        {isAnalyzing ? '분석 중...' : '사주분석 시작'}
      </button>
    </form>
  );
};
```

---

## 7. 에러 처리 및 최적화

### 7.1 에러 처리

```typescript
export class FortuneAnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'FortuneAnalysisError';
  }
}

// 에러 코드 정의
export const FORTUNE_ERRORS = {
  INVALID_INPUT: 'INVALID_INPUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
} as const;
```

### 7.2 요청 제한 및 캐싱

```typescript
// 요청 제한 (사용자당 시간당 최대 요청 수)
const RATE_LIMIT = {
  FREE_USER: 3, // 무료 사용자: 시간당 3회
  PRO_USER: 10, // Pro 사용자: 시간당 10회
};

// 분석 결과 캐싱 (동일한 생년월일시는 캐시 활용)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간
```

### 7.3 응답 시간 최적화

```typescript
// Gemini API 호출 최적화
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash", // 빠른 응답을 위한 Flash 모델 사용
  contents: prompt,
  config: {
    temperature: 0.7,
    maxOutputTokens: 1024,   // 토큰 수 제한으로 응답 시간 단축
    thinkingConfig: {
      thinkingBudget: 0,     // Thinking 비활성화로 즉각 응답
    },
  },
});
```

---

## 8. 환경 변수 정리

```bash
# Google Gemini API (환경 변수명 주의: GEMINI_API_KEY)
GEMINI_API_KEY=your_gemini_api_key_here

# 분석 제한 설정
FORTUNE_ANALYSIS_RATE_LIMIT_FREE=3
FORTUNE_ANALYSIS_RATE_LIMIT_PRO=10

# 캐시 설정
FORTUNE_CACHE_DURATION=86400000  # 24시간 (밀리초)
```

---

## 부록

### A. 공식 문서

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Generative AI SDK](https://github.com/google/generative-ai-node)

### B. 프롬프트 예시 모음

```typescript
// 기본 분석 프롬프트
const BASIC_PROMPT = `
당신은 전문 사주명리학자입니다. 
주어진 정보로 사주를 분석해주세요.
`;

// 고급 분석 프롬프트  
const ADVANCED_PROMPT = `
당신은 30년 경력의 전문 사주명리학자입니다.
깊이 있는 분석을 제공해주세요.
`;
```

### C. 에러 코드 참조

| 코드 | 설명 | 해결 방법 |
|------|------|-----------|
| GEMINI_API_ERROR | Gemini API 호출 실패 | API 키 확인, 네트워크 상태 점검 |
| INVALID_JSON | JSON 파싱 실패 | 프롬프트 수정, 응답 형식 검증 |
| RATE_LIMIT | 요청 제한 초과 | 사용자 제한 확인, 대기 시간 적용 |

