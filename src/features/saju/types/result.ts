export type SajuTestResult = {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  gender: 'male' | 'female';
  result: string; // 마크다운 텍스트
  modelUsed: 'flash' | 'pro'; // 사용된 모델
  createdAt: string;
};

export type SajuTestListItem = Pick<
  SajuTestResult,
  'id' | 'name' | 'birthDate' | 'gender' | 'createdAt'
> & {
  preview: string; // result의 첫 100자
};
