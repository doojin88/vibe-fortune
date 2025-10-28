'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type LoadMoreButtonProps = {
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
};

export function LoadMoreButton({ onLoadMore, isLoading = false, hasMore = true }: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <Button
      onClick={onLoadMore}
      disabled={isLoading}
      variant="outline"
      className="w-full sm:w-auto"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          로딩 중...
        </>
      ) : (
        '더보기'
      )}
    </Button>
  );
}
