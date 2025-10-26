'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import type { SajuTestListItem } from '@/features/saju/types/result';

type SajuTestCardProps = {
  test: SajuTestListItem;
};

export function SajuTestCard({ test }: SajuTestCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/results/${test.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:bg-accent/50"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${test.name}님의 사주분석 결과, ${formatDate(test.createdAt)}에 생성됨`}
    >
      <CardHeader>
        <CardTitle>{test.name}</CardTitle>
        <CardDescription>
          {formatDate(test.birthDate, 'yyyy-MM-dd')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={test.gender === 'male' ? 'default' : 'secondary'}>
            {test.gender === 'male' ? '남성' : '여성'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDate(test.createdAt, 'yyyy년 MM월 dd일')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
