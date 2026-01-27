import { BookItem } from '../engine/display/shelf-composer';
import { BookComboCard } from './BookComboCard';

interface Props {
  books: BookItem[];
  onBookClick: (book: BookItem) => void;
}

export function SpotlightSection({ books, onBookClick }: Props) {
  if (!books || books.length === 0) return null;

  return (
    <section className="py-2">
      <div className="mb-6 flex items-end gap-3 px-1">
        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
            🔥 요즘 뜨는 베스트
        </h3>
        <span className="text-sm font-bold text-red-500 mb-1 animate-pulse">HOT</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.map((book, idx) => (
            <div key={book.id} className="relative">
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2 w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-black text-sm rounded-lg shadow-lg z-10 border-2 border-white transform -rotate-6">
                    {idx + 1}
                </div>
                {/* Reusing BookComboCard but wrapping it to adapt data structure */}
                <BookComboCard 
                    item={{ collection: book, singles: [] }} 
                    onBookClick={onBookClick} 
                />
            </div>
        ))}
      </div>
    </section>
  );
}
