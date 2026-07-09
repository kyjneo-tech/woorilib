'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Book } from '@/entities/book/model/types';
import { bookshelfService } from '@/features/bookshelf/lib/bookshelf-service';
import { useLibraryAvailability } from '../lib/use-library-availability';
import { Card, Badge, Typography } from '@/shared/ui';

interface BookCardProps {
  book: Book;
  showAcquisition?: boolean;
  showQuickActions?: boolean;
}

export function BookCard({ book, showAcquisition = true, showQuickActions = true }: BookCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { isAvailable, isLoading, libraryCount, nearestLibrary } = useLibraryAvailability(book.isbn);

  const handleToggleBookshelf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        await bookshelfService.removeBook(book.isbn);
        setIsSaved(false);
      } else {
        await bookshelfService.addBook(book, 'want_to_read');
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to toggle bookshelf:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `${book.title} - ${book.author || ''}`,
          url: `${window.location.origin}/book/${book.isbn}`,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/book/${book.isbn}`);
      alert('링크가 복사되었습니다!');
    }
  };

  return (
    <div className="relative group">
      <Link href={`/book/${book.isbn}`} className="block">
        <Card className="p-3 h-full flex flex-col">
          {/* Book Cover */}
          <div className="relative aspect-[3/4] rounded-lg mb-3 overflow-hidden bg-surface-secondary">
            {(book.bookImageURL || book.cover_url || book.cover) ? (
              <img
                src={book.bookImageURL || book.cover_url || book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl opacity-30">📚</span>
              </div>
            )}

            {/* Ranking Badge */}
            {book.ranking && book.ranking <= 10 && (
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-accent shadow-sm">
                {book.ranking}
              </div>
            )}

            {/* Verification Badge */}
            {book.isVerified && (
              <div className="absolute top-2 right-2">
                <Badge variant="primary" size="sm" className="bg-primary text-white shadow-sm border-0">
                  ✓ 검증
                </Badge>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 flex flex-col">
            <Typography variant="body2" weight="bold" className="line-clamp-2 leading-tight mb-1">
              {book.title}
            </Typography>

            {book.author && (
              <Typography variant="caption" color="muted" className="line-clamp-1">
                {book.author}
              </Typography>
            )}

            {/* Quick Acquisition Indicators */}
            {showAcquisition && (
              <div className="flex flex-wrap gap-1 mt-auto pt-2">
                {isLoading ? (
                  <span className="text-[10px] text-gray-400">...</span>
                ) : isAvailable ? (
                  <Badge variant="primary" size="sm" className="bg-blue-50 text-blue-600 border-0">
                    🏛️ {nearestLibrary ? nearestLibrary.replace(/도서관/g, '') : '도서관'} {libraryCount > 1 && `+${libraryCount - 1}`}
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
        </Card>
      </Link>

      {/* Quick Action Buttons - Hover overlay */}
      {showQuickActions && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleBookshelf}
            disabled={isSaving}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-transform hover:scale-110 ${
              isSaved ? 'bg-primary text-white' : 'bg-white text-text'
            }`}
            title={isSaved ? '책장에서 제거' : '책장에 담기'}
          >
            {isSaving ? '...' : isSaved ? '✓' : '❤️'}
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-transform hover:scale-110 bg-white text-text"
            title="공유하기"
          >
            📤
          </button>
        </div>
      )}
    </div>
  );
}
