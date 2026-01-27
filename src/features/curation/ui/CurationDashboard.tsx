
'use client';

import { useState, useEffect } from 'react';
import { DashboardData, BookItem } from '../engine/display/shelf-composer';
import { ShelfView } from './ShelfView';
import { BookDetailModal } from './BookDetailModal';
import { HeroSection } from './HeroSection';
import { SpotlightSection } from './SpotlightSection';
import { LibraryShelf } from './LibraryShelf';
import { useRegionStore } from '@/features/region-selector/lib/use-region-store';

interface Props {
  ageGroup: string | null;
}

export function CurationDashboard({ ageGroup }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [modalSource, setModalSource] = useState<'library' | 'general'>('general');

  const { getRegionCode, getDisplayName } = useRegionStore();
  const regionCode = getRegionCode();

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        // Map AgeGroup to Months (Approximation)
        let months = 36; // Default 3 years
        if (ageGroup === '0-2') months = 18;
        else if (ageGroup === '3-4') months = 42;
        else if (ageGroup === '5-6') months = 66;
        else if (ageGroup === '7-8') months = 90;

        const url = `/api/curation/dashboard?months=${months}${regionCode ? `&region=${regionCode}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (ageGroup) {
      fetchDashboard();
    }
  }, [ageGroup, regionCode]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-secondary)' }} />
        ))}
      </div>
    );
  }

  if (!data) return <div className="text-center py-10">데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Stage Info Header (Compact Version) */}
      {/* 
        1. HEADER: Branding & Age 
      */}
      <div className="flex items-center justify-between px-2">
        <div>
            <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                {data.stage.label} ({ageGroup}세)
            </span>
            <h2 className="mt-2 text-xl font-bold text-gray-800">
                {data.stage.description}
            </h2>
        </div>
      </div>

      {/* 
        2. HERO: The "One Thing"
      */}
      {data.hero && (
        <HeroSection 
            book={data.hero} 
            onClick={(book) => {
                setModalSource('general');
                setSelectedBook(book);
            }} 
            ageGroup={ageGroup} 
        />
      )}

      {/* 
        3. SPOTLIGHT: Top 3
      */}
      {data.spotlight && data.spotlight.length > 0 && (
        <SpotlightSection 
            books={data.spotlight} 
            onBookClick={(book) => {
                setModalSource('general');
                setSelectedBook(book);
            }} 
        />
      )}

      <hr className="border-gray-100" />

      {/* 
        3.5 LIBRARY: Purified Library Books
      */}
      <LibraryShelf 
        ageGroupId={ageGroup === '0-2' ? 0 : ageGroup === '3-4' ? 3 : ageGroup === '5-6' ? 5 : 7}
        regionCode={regionCode}
        onBookClick={(book) => {
            setModalSource('library');
            setSelectedBook(book);
        }}
      />

      {/* 
        4. SHELVES: Categories
      */}
      <div className="flex flex-col gap-12 pb-12">
        {data.shelves.map(shelf => (
          <ShelfView 
            key={shelf.id} 
            shelf={shelf} 
            onBookClick={(book: BookItem) => {
                setModalSource('general');
                setSelectedBook(book);
            }} 
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedBook && (
        <BookDetailModal 
            book={selectedBook} 
            source={modalSource}
            onClose={() => setSelectedBook(null)} 
        />
      )}
    </div>
  );
}
