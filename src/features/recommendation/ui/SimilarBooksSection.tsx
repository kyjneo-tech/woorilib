'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { libraryApiClient } from '@/entities/book/api/library-api.client';

interface SimilarBook {
  isbn: string;
  title: string;
  author: string;
  cover?: string;
}

interface SimilarBooksSectionProps {
  isbn: string;
  className?: string;
}

/**
 * 비슷한 책 추천 섹션
 * 도서관나루 recommandList API 사용
 * "이 책을 빌린 사람들이 함께 빌린 책"
 */
export function SimilarBooksSection({ isbn, className }: SimilarBooksSectionProps) {
  const [books, setBooks] = useState<SimilarBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilarBooks = async () => {
      if (!isbn) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await libraryApiClient.getRecommendList(isbn);
        const docs = response?.response?.docs || [];

        const mappedBooks: SimilarBook[] = docs.slice(0, 8).map((item: any) => ({
          isbn: item.book?.isbn13 || item.book?.isbn || '',
          title: item.book?.bookname || '',
          author: item.book?.authors || '',
          cover: item.book?.bookImageURL,
        }));

        setBooks(mappedBooks);
      } catch (err) {
        console.error('Failed to fetch similar books:', err);
        setError('추천 도서를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarBooks();
  }, [isbn]);

  // 로딩 중
  if (isLoading) {
    return (
      <section className={className}>
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-text)' }}>
          📚 이 책을 좋아한 아이들이 함께 읽은 책
        </h3>
        <div className="flex justify-center py-6">
          <div className="animate-spin text-2xl">📚</div>
        </div>
      </section>
    );
  }

  // 에러 또는 빈 상태
  if (error || books.length === 0) {
    return null; // 추천 책이 없으면 섹션 자체를 숨김
  }

  return (
    <section className={className}>
      <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-text)' }}>
        📚 이 책을 좋아한 아이들이 함께 읽은 책
      </h3>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {books.map((book, index) => (
            <Link
              key={book.isbn || index}
              href={`/book/${book.isbn}`}
              className="flex-shrink-0 w-24"
            >
              {/* 표지 */}
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📚
                  </div>
                )}
              </div>
              {/* 제목 */}
              <h4 className="text-xs font-medium line-clamp-2" style={{ color: 'var(--color-text)' }}>
                {book.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
