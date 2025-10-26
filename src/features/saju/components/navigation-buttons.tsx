'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export function NavigationButtons() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleNewTest = () => {
    router.push('/dashboard/new');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <Button
        onClick={handleBackToDashboard}
        variant="outline"
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      <Button
        onClick={handleNewTest}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        새 검사하기
      </Button>
    </div>
  );
}
