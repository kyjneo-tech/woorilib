'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Book } from '@/entities/book/model/types';
import { bookshelfService } from '@/features/bookshelf/lib/bookshelf-service';

interface BookCardProps {
  book: Book;
  showAcquisition?: boolean;
  showQuickActions?: boolean;
}

export function BookCard({ book, showAcquisition = true, showQuickActions = true }: BookCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddToBookshelf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    try {
      await bookshelfService.addBook(book, 'want_to_read');
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to add to bookshelf:', error);
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
        <div className="card p-3 cursor-pointer hover:scale-[1.02] transition-transform h-full">
          {/* Book Cover */}
          <div className="relative aspect-[3/4] rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--color-surface-secondary)' }}>
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
            
            {/* Ranking Badge */}
            {book.ranking && book.ranking <= 10 && (
              <div 
                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                {book.ranking}
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-1">
            <h3 
              className="font-semibold text-sm line-clamp-2 leading-tight"
              style={{ color: 'var(--color-text)' }}
            >
              {book.title}
            </h3>
            
            {book.author && (
              <p 
                className="text-xs line-clamp-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {book.author}
              </p>
            )}

            {/* Quick Acquisition Indicators */}
            {showAcquisition && (
              <div className="flex flex-wrap gap-1 pt-2">
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}
                >
                  🏛️ 주변도서관
                </span>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#EA580C' }}
                >
                  🥕 당근재고
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Action Buttons - Hover overlay */}
      {showQuickActions && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToBookshelf}
            disabled={isSaving || isSaved}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-transform hover:scale-110"
            style={{ 
              background: isSaved ? 'var(--color-primary)' : 'white',
              color: isSaved ? 'white' : 'var(--color-text)',
            }}
            title={isSaved ? '담김' : '책장에 담기'}
          >
            {isSaving ? '...' : isSaved ? '✓' : '❤️'}
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-transform hover:scale-110"
            style={{ background: 'white', color: 'var(--color-text)' }}
            title="공유하기"
          >
            📤
          </button>
        </div>
      )}
    </div>
  );
}

