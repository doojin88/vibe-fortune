import { z } from 'zod';

export const sajuInputSchema = z.object({
  name: z.string().min(1, '성함을 입력해주세요').max(50, '성함은 50자 이하로 입력해주세요'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  birthTimeUnknown: z.boolean().default(false),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: '성별을 선택해주세요' }),
  }),
});

export type SajuInput = z.infer<typeof sajuInputSchema>;
