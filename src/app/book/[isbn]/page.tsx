'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/entities/book/model/types';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { AcquisitionPanel } from '@/features/acquisition/ui/AcquisitionPanel';
import { QuickReadButton } from '@/features/reading-record/ui/QuickReadButton';
import { SimilarBooksSection } from '@/features/recommendation/ui/SimilarBooksSection';
import { bookshelfService, BookshelfItem, BookshelfStatus } from '@/features/bookshelf/lib/bookshelf-service';
import { ReviewSection } from '@/features/review';
import { useAuth } from '@/shared/lib/hooks/use-auth';

interface BookDetailPageProps {
  params: Promise<{ isbn: string }>;
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const isbn = resolvedParams.isbn;
  const { isAuthenticated } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookshelfItem, setBookshelfItem] = useState<BookshelfItem | null>(null);
  const [savingToBookshelf, setSavingToBookshelf] = useState(false);

  useEffect(() => {
    const fetchBookDetail = async () => {
      setIsLoading(true);
      try {
        const response = await libraryApiClient.getBookDetail(isbn);
        const detail = response?.response?.detail?.[0]?.book;
        
        if (detail) {
          setBook({
            isbn: detail.isbn13 || isbn,
            title: detail.bookname,
            author: detail.authors,
            publisher: detail.publisher,
            publishYear: detail.publication_year,
            bookImageURL: detail.bookImageURL,
            className: detail.class_nm,
            classNo: detail.class_no,
          });
        } else {
          setError('책 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Book detail error:', err);
        setError('책 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isbn) {
      fetchBookDetail();
    }
  }, [isbn]);

  // Check if book is in bookshelf
  useEffect(() => {
    const checkBookshelf = async () => {
      if (isAuthenticated && isbn) {
        const item = await bookshelfService.isBookSaved(isbn);
        setBookshelfItem(item);
      }
    };
    checkBookshelf();
  }, [isAuthenticated, isbn]);

  const handleAddToBookshelf = async (status: BookshelfStatus = 'want_to_read') => {
    if (!book) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setSavingToBookshelf(true);
    const item = await bookshelfService.addBook(book, status);
    if (item) {
      setBookshelfItem(item);
    }
    setSavingToBookshelf(false);
  };

  const handleRemoveFromBookshelf = async () => {
    if (!book) return;
    
    setSavingToBookshelf(true);
    await bookshelfService.removeBook(book.isbn);
    setBookshelfItem(null);
    setSavingToBookshelf(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">📚</div>
          <p style={{ color: 'var(--color-text-muted)' }}>책 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '책을 찾을 수 없습니다.'}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-4" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <button onClick={() => router.back()} className="text-xl">
          ←
        </button>
        <span className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          책 정보
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Book Info Section */}
        <section className="flex gap-4 mb-8">
          {/* Cover */}
          <div 
            className="w-28 h-40 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'var(--color-surface-secondary)', boxShadow: 'var(--shadow-md)' }}
          >
            {book.bookImageURL ? (
              <img
                src={book.bookImageURL}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl opacity-30">📚</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-2 leading-tight" style={{ color: 'var(--color-text)' }}>
              {book.title}
            </h1>
            
            {book.author && (
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {book.author}
              </p>
            )}
            
            {book.publisher && (
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {book.publisher}
              </p>
            )}
            
            {book.publishYear && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {book.publishYear}년
              </p>
            )}

            {book.className && (
              <span 
                className="inline-block mt-3 text-xs px-2 py-1 rounded-full"
                style={{ background: 'var(--color-secondary-light)', color: 'var(--color-text-secondary)' }}
              >
                {book.className}
              </span>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex gap-2 mb-8">
          {bookshelfItem ? (
            <>
              <button
                onClick={handleRemoveFromBookshelf}
                disabled={savingToBookshelf}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ 
                  background: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                  border: '2px solid var(--color-primary)',
                }}
              >
                {savingToBookshelf ? '...' : `✓ 책장에 있음 (${
                  bookshelfItem.status === 'want_to_read' ? '읽고싶음' :
                  bookshelfItem.status === 'reading' ? '읽는중' : '완독'
                })`}
              </button>
            </>
          ) : (
            <button
              onClick={() => handleAddToBookshelf('want_to_read')}
              disabled={savingToBookshelf}
              className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--color-primary)' }}
            >
              {savingToBookshelf ? '저장 중...' : '❤️ 책장에 담기'}
            </button>
          )}
          <button
            className="px-4 py-3 rounded-xl"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
          >
            📤
          </button>
        </section>

        {/* Acquisition Panel */}
        <section className="card p-4 mb-6">
          <AcquisitionPanel isbn={book.isbn} title={book.title} />
        </section>

        {/* Quick Read Button */}
        <section className="mb-6">
          <QuickReadButton
            isbn={book.isbn}
            bookTitle={book.title}
            bookAuthor={book.author}
            bookCover={book.bookImageURL}
          />
        </section>

        {/* Similar Books */}
        <SimilarBooksSection isbn={book.isbn} className="mb-6" />

        {/* Reviews Section */}
        <section className="card p-4 mb-6">
          <ReviewSection isbn={book.isbn} />
        </section>
      </main>
    </div>
  );
}

