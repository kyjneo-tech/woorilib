'use client';

import type { BookItem } from '@/features/curation/engine/display/shelf-composer';
import { Flame, ChevronRight } from 'lucide-react';

interface SpotlightSectionProps {
  books: BookItem[];
  onBookClick?: (book: BookItem) => void;
}

export function SpotlightSection({ books, onBookClick }: SpotlightSectionProps) {
  if (!books || books.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Flame className="text-orange-500 fill-orange-500" size={20} />
          지금 뜨는 인기 도서
        </h3>
        <button className="text-xs font-bold text-gray-400 flex items-center gap-0.5 hover:text-gray-600">
          전체보기 <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {books.map((book, idx) => (
          <div
            key={book.id}
            onClick={() => onBookClick?.(book)}
            className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex gap-3">
              <div className="relative w-16 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {(book.cover_url || book.bookImageURL || book.cover) ? (
                  <img src={book.cover_url || book.bookImageURL || book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Img</div>
                )}
                <div className="absolute top-0 left-0 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-br-lg">
                  {idx + 1}
                </div>
              </div>
              <div className="flex flex-col justify-between py-0.5 min-w-0">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
                    {book.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">
                    {book.publisher}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {book.tags?.slice(0, 1).map((tag, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
