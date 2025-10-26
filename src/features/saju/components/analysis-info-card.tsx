'use client';

import { SajuTestResult } from '@/features/saju/types/result';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils/date';

type AnalysisInfoCardProps = {
  sajuTest: SajuTestResult;
};

export function AnalysisInfoCard({ sajuTest }: AnalysisInfoCardProps) {
  const formatBirthTime = (time: string | null) => {
    if (!time) return '미상';
    const [hour, minute] = time.split(':');
    return `${hour}시 ${minute}분`;
  };

  const genderLabel = sajuTest.gender === 'male' ? '남성' : '여성';
  const genderVariant = sajuTest.gender === 'male' ? 'default' : 'secondary';

  return (
    <Card>
      <CardHeader>
        <CardTitle>분석 대상 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[80px]">이름</span>
          <span className="font-semibold">{sajuTest.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[80px]">생년월일</span>
          <span>{formatDate(sajuTest.birthDate)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[80px]">출생시간</span>
          <span>{formatBirthTime(sajuTest.birthTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[80px]">성별</span>
          <Badge variant={genderVariant}>{genderLabel}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[80px]">분석 날짜</span>
          <span className="text-sm">{formatDateTime(sajuTest.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
