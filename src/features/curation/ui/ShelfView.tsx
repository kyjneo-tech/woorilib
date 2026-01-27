
import { useRef, useState, useEffect } from 'react';
import { Shelf, BookItem } from '../engine/display/shelf-composer';
import { BookComboCard } from './BookComboCard';

interface Props {
  shelf: Shelf;
  onBookClick: (book: BookItem) => void;
}
export function ShelfView({ shelf, onBookClick }: Props) {
  if (shelf.items.length === 0) return null;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Check scroll position to toggle buttons
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeft(scrollLeft > 0);
    // Allow small tolerance (e.g. 1px) for float math
    setShowRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [shelf]);

  const scrollByAmount = (direction: number) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction * (scrollContainerRef.current.clientWidth * 0.8);
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      // setTimeout to check after scroll animation (approx) 
      setTimeout(checkScroll, 500);
    }
  };

  return (
    <section className="relative group/section">
      <div className="mb-6 px-1 flex justify-between items-end">
        <div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
                {shelf.title}
            </h3>
            <p className="text-sm font-medium opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                {shelf.description}
            </p>
        </div>
        
        {/* Helper text for Desktop? Optional */}
        {/* <div className="hidden md:block text-xs opacity-50">Scroll or Drag</div> */}
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

        {/* Scroll Container */}
        <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="overflow-x-auto pb-6 px-4 flex gap-4 snap-x snap-mandatory -mx-4 scroll-pl-4 scrollbar-hide"
        >
          {shelf.items.map((item, idx) => (
            <div key={`${item.collection.id}-${idx}`} className="flex-none w-[280px] snap-start transition-opacity duration-300">
              <BookComboCard item={item} onBookClick={onBookClick} />
            </div>
          ))}
          {/* Spacer for cleaner end scroll */}
          <div className="w-1 flex-none" />
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

        {/* Fade Edges (Optional: Can be removed if design prefers clean cut) */}
        <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-white/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </section>
  );
}
