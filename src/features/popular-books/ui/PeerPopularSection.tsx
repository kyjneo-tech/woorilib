'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { popularBooksService, PopularBook, getAladinCategoryByAge } from '../lib/popular-books.service';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { calculateAge } from '@/features/family/model/types';

interface PeerPopularSectionProps {
  className?: string;
  age?: number;
}

/**
 * 또래 인기 도서 섹션
 * - 또래 아이들이 많이 읽는 책
 * - 알라딘 베스트셀러
 */
export function PeerPopularSection({ className, age }: PeerPopularSectionProps) {
  const [books, setBooks] = useState<PopularBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();
  // props.age가 있으면 우선 사용, 없으면 family store 사용, 그것도 없으면 5세
  const childAge = age ?? (selectedChild ? calculateAge(selectedChild.birthDate) : 5);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 하이브리드 베스트셀러 (베스트셀러 + 또래 픽 배지)
        const data = await popularBooksService.getHybridBestsellers(childAge, 20);
        setBooks(data);
      } catch (error) {
        console.error('Failed to fetch popular books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [childAge]);

  return (
    <section className={className}>
      {/* 헤더 */}
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
          <span>🔥</span>
          <span>{childAge}세 인기 도서 모음</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          서점 베스트셀러와 친구들이 읽은 책을 한눈에!
        </p>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin text-2xl">📚</div>
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && books.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          인기 도서를 불러오지 못했어요.
        </div>
      )}

      {/* 책 목록 */}
      {!isLoading && books.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {books.map((book, index) => (
              <Link
                key={book.isbn || index}
                href={`/book/${book.isbn}`}
                className="flex-shrink-0 w-28 group"
              >
                {/* 표지 */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📚
                    </div>
                  )}
                  {/* 순위 뱃지 */}
                  {book.rank && (
                    <div className="absolute top-1 left-1 w-6 h-6 bg-black/50 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {book.rank}
                    </div>
                  )}
                  {/* 또래 인기 뱃지 (읽은 수가 있을 때만) */}
                  {book.readCount && book.readCount > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-[10px] font-medium py-1 px-1 text-center backdrop-blur-sm">
                      🔥 또래 {book.readCount}명 읽음
                    </div>
                  )}
                </div>
                {/* 제목 */}
                <h3 className="text-xs font-bold line-clamp-2 mb-0.5 group-hover:text-green-600 transition-colors" style={{ color: 'var(--color-text)' }}>
                  {book.title}
                </h3>
                {/* 저자 */}
                <p className="text-[10px] text-gray-500 truncate">
                  {book.author}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
