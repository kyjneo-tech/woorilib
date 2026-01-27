'use client';

import { useState, useEffect, useRef } from 'react';
import { BookItem } from '../engine/display/shelf-composer';
import { BookComboCard } from './BookComboCard';
import { AGE_GROUPS } from '@/shared/config/constants';

interface ComboItem {
  collection: BookItem;
  singles: BookItem[];
}

interface LibraryShelfProps {
  ageGroupId: number;
  regionCode?: string | null;
  onBookClick: (book: BookItem) => void;
}

export function LibraryShelf({ ageGroupId, regionCode, onBookClick }: LibraryShelfProps) {
  const [items, setItems] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Check scroll position to toggle buttons
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeft(scrollLeft > 0);
    // Allow small tolerance (e.g. 1px) for float math
    setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollByAmount = (direction: number) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction * (scrollContainerRef.current.clientWidth * 0.8);
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      // setTimeout to check after scroll animation (approx) 
      setTimeout(checkScroll, 500);
    }
  };

  // Find label
  const ageLabel = AGE_GROUPS.find(g => g.id === String(ageGroupId))?.label || `${ageGroupId}세`;

  useEffect(() => {
    async function fetchLibraryItems() {
      setLoading(true);
      try {
        const url = `/api/curation/library?age=${ageGroupId}${regionCode ? `&region=${regionCode}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch library books');
        const data = await res.json();
        // The API returns { books: ComboItem[] }
        setItems(data.books || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLibraryItems();
  }, [ageGroupId, regionCode]);

  useEffect(() => {
    if (!loading && items.length > 0) {
      // Initial check after data is loaded and rendered
      setTimeout(checkScroll, 100);
    }
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [loading, items]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden px-4 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-none w-[280px] h-48 bg-gray-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-black mb-2 border border-purple-100">
           🏛️ 도서관 큐레이션
        </div>
        <h3 className="text-2xl font-black text-gray-900 leading-tight">
            우리 동네 대출 베스트<br />
            <span className="text-purple-600">인기 검증 도서</span>
        </h3>
        <p className="text-sm text-gray-500 mt-2 break-keep">
            {ageLabel} 친구들이 가장 많이 빌려본 책이에요.<br/>
            (인기가 많아 대출 중일 수 있어요!)
        </p>
      </div>

      <div className="relative group">
        {/* Left Button - Desktop Only */}
        {showLeft && (
            <button 
                onClick={() => scrollByAmount(-1)}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 
                           w-12 h-12 bg-white/95 dark:bg-black/95 shadow-xl rounded-full 
                           items-center justify-center -ml-6 opacity-0 group-hover:opacity-100 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           border border-black/5 cursor-pointer backdrop-blur-sm"
                aria-label="Scroll Left"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto pb-6 px-4 flex gap-4 snap-x snap-mandatory -mx-4 scroll-pl-4 scrollbar-hide touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((item, idx) => (
            <div key={`${item.collection.id}-${idx}`} className="flex-none w-[280px] snap-start">
              <BookComboCard item={item} onBookClick={onBookClick} />
            </div>
          ))}
          <div className="w-4 flex-none" />
        </div>

        {/* Right Button - Desktop Only */}
        {showRight && (
            <button 
                onClick={() => scrollByAmount(1)}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 
                           w-12 h-12 bg-white/95 dark:bg-black/95 shadow-xl rounded-full 
                           items-center justify-center -mr-6 opacity-0 group-hover:opacity-100 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           border border-black/5 cursor-pointer backdrop-blur-sm"
                aria-label="Scroll Right"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        )}
      </div>
    </section>
  );
}
