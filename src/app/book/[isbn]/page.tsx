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
import { PageHeader, LoadingSpinner, Button, Card, Typography, Badge } from '@/shared/ui';

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
        const detail = (response as any)?.response?.detail?.[0]?.book;

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
        <Typography variant="body2" color="muted" className="mt-4">책 정보 불러오는 중...</Typography>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Typography color="primary" className="mb-4">{error || '책을 찾을 수 없습니다.'}</Typography>
        <Button onClick={() => router.back()} variant="primary">
          뒤로 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 bg-background">
      <PageHeader title="책 상세 정보" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Book Info Section */}
        <section className="flex gap-6 mb-8">
          {/* Cover */}
          <div className="w-32 h-44 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg bg-surface-secondary">
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
          <div className="flex-1 min-w-0 pt-2">
            <Typography variant="h2" className="mb-2 leading-tight">
              {book.title}
            </Typography>

            <div className="space-y-1">
              {book.author && (
                <Typography variant="body2" color="secondary">
                  {book.author}
                </Typography>
              )}

              {book.publisher && (
                <Typography variant="body2" color="muted">
                  {book.publisher} • {book.publishYear}년
                </Typography>
              )}
            </div>

            {book.className && (
              <Badge variant="secondary" className="mt-4">
                {book.className}
              </Badge>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex gap-3 mb-8">
          <Button
            onClick={bookshelfItem ? handleRemoveFromBookshelf : () => handleAddToBookshelf('want_to_read')}
            isLoading={savingToBookshelf}
            variant={bookshelfItem ? 'outline' : 'primary'}
            fullWidth
            size="lg"
          >
            {bookshelfItem ? (
              `✓ 책장에 있음 (${bookshelfItem.status === 'want_to_read' ? '읽고싶음' :
                bookshelfItem.status === 'reading' ? '읽는중' : '완독'
              })`
            ) : (
              '❤️ 책장에 담기'
            )}
          </Button>
          <Button variant="ghost" className="bg-surface shadow-sm">
            📤
          </Button>
        </section>

        {/* Acquisition Panel */}
        <Card className="p-4 mb-6">
          <AcquisitionPanel isbn={book.isbn} title={book.title} />
        </Card>

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
        <Card className="p-4 mb-6">
          <ReviewSection isbn={book.isbn} />
        </Card>
      </main>
    </div>
  );
}

