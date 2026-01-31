'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { Book } from '@/entities/book/model/types';
import { BookCard } from '@/features/book-search/ui/BookCard';
import { PeerPopularSection } from '@/features/popular-books/ui/PeerPopularSection';
import { recommendationService } from '@/features/recommendation/lib/recommendation-service';
import { AGE_GROUPS, AgeGroupId } from '@/shared/config/constants';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recommendationTitle, setRecommendationTitle] = useState('');

  const performSearch = async (query: string, age?: number) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const ageParam = age !== undefined ? `&age=${age}` : '';
      const response = await fetch(`/api/search/unified?q=${encodeURIComponent(query.trim())}${ageParam}`);
      if (!response.ok) {
        const errData = await response.json();
        console.error('Search API Error:', errData);
        throw new Error(errData.details || errData.error || 'Search failed');
      }
      
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Search error:', error);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Update URL without reload
    const currentAge = searchParams.get('age');
    const ageParam = currentAge ? `&age=${currentAge}` : '';
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${ageParam}`, { scroll: false });
    
    performSearch(searchQuery, currentAge ? parseInt(currentAge) : undefined);
  };

  // Auto-search if query param exists on mount
  useEffect(() => {
    const searchType = searchParams.get('type');
    // Parse age from URL or default to 0 if not present but we want strictness? 
    // Actually if age is missing, performSearch(q, undefined) -> route uses 0 default.
    const ageStr = searchParams.get('age');
    const ageNum = ageStr ? parseInt(ageStr) : undefined;
    const ageGroup = searchParams.get('age') as AgeGroupId;

    if (searchType === 'recommendation' && ageGroup) {
       // ... existing recommendation logic ...
       setIsLoading(true);
       setHasSearched(true);
       
       const ageLabel = AGE_GROUPS.find(g => g.id === ageGroup)?.label || '추천';
       setRecommendationTitle(`${ageLabel} 추천 도서`);
 
       recommendationService.getRecommendations({
         ageGroup,
         limit: 50,
       }).then(recs => {
         setBooks(recs);
       }).catch(err => {
         console.error('Failed to fetch recommendations:', err);
       }).finally(() => {
         setIsLoading(false);
       });
    } else if (initialQuery) {
      performSearch(initialQuery, ageNum);
    }
  }, [searchParams, initialQuery]);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="책 제목, 저자, 출판사로 도서관 소장 여부 확인"
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ background: 'var(--color-surface-secondary)' }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ 
                  background: searchQuery ? 'var(--color-primary)' : 'transparent',
                  color: searchQuery ? 'white' : 'var(--color-text-muted)',
                }}
              >
                🔍
              </button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-4xl">📚</div>
          </div>
        )}

        {/* No Search Yet */}
        {!hasSearched && !isLoading && (
          <div className="space-y-8">
            <div className="text-center py-10">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                어떤 책을 찾으세요?
              </p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                책 제목, 저자명으로 검색해보세요
              </p>
            </div>
            
            {/* Initial Recommendations */}
            <PeerPopularSection />
          </div>
        )}

        {/* No Results */}
        {hasSearched && !isLoading && books.length === 0 && (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">😢</span>
            <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
              검색 결과가 없어요
            </p>
            <p style={{ color: 'var(--color-text-muted)' }}>
              다른 검색어로 시도해보세요
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && books.length > 0 && (
          <>
            {recommendationTitle ? (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  👶 {recommendationTitle}
                </h2>
                <p className="text-sm text-gray-500">
                  아이 연령에 딱 맞는 추천 도서 {books.length}권을 모았습니다.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {books.length}개의 결과
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {books.map((book, index) => (
                <BookCard key={book.isbn || `search-${index}`} book={book} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-surface-secondary)' }}
      >
        <div className="max-w-2xl mx-auto flex justify-around">
          <Link href="/home" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>홈</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>검색</span>
          </Link>
          <Link href="/my-bookshelf" className="flex flex-col items-center gap-1">
            <span className="text-xl">📚</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>책장</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1">
            <span className="text-xl">⚙️</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>설정</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin text-4xl">📚</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
