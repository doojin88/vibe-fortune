'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SajuTestCard } from './saju-test-card';
import { SearchBar } from './search-bar';
import { LoadMoreButton } from './load-more-button';
import { loadMoreTests } from '@/features/saju/actions/load-more-tests';
import { Button } from '@/components/ui/button';
import { FileQuestion, Search } from 'lucide-react';
import type { SajuTestListItem } from '@/features/saju/types/result';

type DashboardContentProps = {
  initialTests: SajuTestListItem[];
};

export function DashboardContent({ initialTests }: DashboardContentProps) {
  const [tests, setTests] = useState<SajuTestListItem[]>(initialTests);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(10);
  const [hasMore, setHasMore] = useState(initialTests.length === 10);
  const [isLoading, setIsLoading] = useState(false);

  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      const result = await loadMoreTests(offset);
      if (result.success && result.data) {
        setTests((prev) => [...prev, ...result.data!]);
        setOffset((prev) => prev + 10);
        setHasMore(result.hasMore || false);
      }
    } catch (error) {
      console.error('더보기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">아직 사주분석 이력이 없습니다</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          첫 사주분석을 시작해보세요
        </p>
        <Link href="/dashboard/new">
          <Button>첫 검사 시작하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SearchBar onSearch={handleSearch} />

      {searchQuery && filteredTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            다른 검색어로 시도해보세요
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            검색 초기화
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <SajuTestCard key={test.id} test={test} />
            ))}
          </div>

          {!searchQuery && hasMore && (
            <div className="flex justify-center">
              <LoadMoreButton
                onLoadMore={handleLoadMore}
                isLoading={isLoading}
                hasMore={hasMore}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
