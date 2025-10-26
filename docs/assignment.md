# 구독제 사주분석 서비스

## 과제

다음 기능을 Clerk, Supabase를 연동하여 구현한 뒤 배포하라.

---

## 통과 조건

### 아래 기능 연동

- 인증(Google 로그인)
- Gemini API 기반 사주분석

### 포함 페이지

홈 이외의 페이지는 인증 상태로만 접근 가능합니다.
인증관련 페이지는 모두 Clerk SDK에서 기본적으로 제공되는 것을 사용합니다.

- 홈 (랜딩페이지)
- 대시보드 (사주분석목록)
- 새 사주분석하기
- 사주분석 상세보기

---

## TIP

- Clerk SDK/Webhook을 사용해야합니다.
- Clerk Webhook은 서비스가 배포된 상태에서만 작동합니다!
- 사주분석 시스템 프롬프트 예시를 첨부합니다.

```typescript
import type { TestInput } from '@/types/test';

export const generateSajuPrompt = (input: TestInput): string => {
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
