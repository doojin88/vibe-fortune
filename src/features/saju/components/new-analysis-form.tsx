'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { sajuInputSchema, type SajuInput } from '../types/input';
import { createSajuTest } from '../actions/create-saju-test';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';

export function NewAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SajuInput>({
    resolver: zodResolver(sajuInputSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      birthDate: '',
      birthTime: null,
      birthTimeUnknown: false,
      gender: undefined,
    },
  });

  const watchBirthDate = watch('birthDate');
  const watchGender = watch('gender');

  const onSubmit = async (data: SajuInput) => {
    setIsLoading(true);

    try {
      const result = await createSajuTest(data);

      if (!result.success && 'error' in result) {
        toast({
          variant: 'destructive',
          title: '분석 실패',
          description: result.error,
        });
        setIsLoading(false);
      }
      // 성공 시 서버 액션 내부에서 redirect 처리됨
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '분석 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
      setIsLoading(false);
    }
  };

  const handleBirthTimeUnknownChange = (checked: boolean) => {
    setBirthTimeUnknown(checked);
    setValue('birthTimeUnknown', checked);
    if (checked) {
      setValue('birthTime', null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 성함 입력 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              성함 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="성함을 입력해주세요"
              disabled={isLoading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 생년월일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">
              생년월일 <span className="text-destructive">*</span>
            </Label>
            <DatePicker
              value={watchBirthDate ? new Date(watchBirthDate) : undefined}
              onChange={(date) => {
                if (date) {
                  setValue('birthDate', format(date, 'yyyy-MM-dd'), {
                    shouldValidate: true,
                  });
                }
              }}
              placeholder="생년월일을 선택해주세요"
              disabled={isLoading}
            />
            {errors.birthDate && (
              <p className="text-sm text-destructive">
                {errors.birthDate.message}
              </p>
            )}
          </div>

          {/* 출생시간 입력 */}
          <div className="space-y-2">
            <Label htmlFor="birthTime">출생시간</Label>
            <div className="space-y-3">
              <TimePicker
                value={watch('birthTime') || undefined}
                onChange={(time) => {
                  setValue('birthTime', time, { shouldValidate: true });
                }}
                disabled={isLoading || birthTimeUnknown}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="birthTimeUnknown"
                  checked={birthTimeUnknown}
                  onCheckedChange={handleBirthTimeUnknownChange}
                  disabled={isLoading}
                />
                <label
                  htmlFor="birthTimeUnknown"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  출생시간 모름
                </label>
              </div>
            </div>
            {errors.birthTime && (
              <p className="text-sm text-destructive">
                {errors.birthTime.message}
              </p>
            )}
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <Label>
              성별 <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={watchGender}
              onValueChange={(value) =>
                setValue('gender', value as 'male' | 'female', {
                  shouldValidate: true,
                })
              }
              disabled={isLoading}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="font-normal">
                  남성
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="font-normal">
                  여성
                </Label>
              </div>
            </RadioGroup>
            {errors.gender && (
              <p className="text-sm text-destructive">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>분석 중입니다... (10-30초 소요)</span>
              </div>
            ) : (
              '검사 시작'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
