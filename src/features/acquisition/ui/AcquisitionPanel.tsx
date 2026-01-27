'use client';

import { useState, useEffect } from 'react';
import { libraryApiClient, Library } from '@/entities/book/api/library-api.client';
import { linkGenerators } from '@/shared/lib/utils/link-generators';
import { useUserStore } from '@/entities/user/model/user-store';

interface AcquisitionPanelProps {
  isbn: string;
  title: string;
}

interface LibraryData {
  status: 'idle' | 'loading' | 'success' | 'error';
  count: number;
  libraries: Library[];
}

export function AcquisitionPanel({ isbn, title }: AcquisitionPanelProps) {
  const { regionCode, regionName } = useUserStore();
  const [libraryData, setLibraryData] = useState<LibraryData>({
    status: 'idle',
    count: 0,
    libraries: [],
  });

  // Fetch library data on mount
  useEffect(() => {
    const fetchLibraryData = async () => {
      setLibraryData(prev => ({ ...prev, status: 'loading' }));
      
      try {
        const response = await libraryApiClient.searchLibrariesByBook({
          isbn,
          region: regionCode,
          pageSize: 10,
        });
        
        setLibraryData({
          status: 'success',
          count: response.totalCount,
          libraries: response.libraries,
        });
      } catch (error) {
        console.error('Library search error:', error);
        setLibraryData(prev => ({ ...prev, status: 'error' }));
      }
    };

    fetchLibraryData();
  }, [isbn, regionCode]);

  // Generate links
  const daangnLinks = linkGenerators.daangn(title, regionName);
  const aladinLink = linkGenerators.aladinUsed(isbn);
  const naverLink = linkGenerators.naverShopping(isbn);

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
        🧭 이 책 구하는 법
      </h3>

      <div className="space-y-2">
        {/* Library Option */}
        <button
          onClick={() => {
            if (libraryData.libraries[0]?.homepage) {
              openLink(libraryData.libraries[0].homepage);
            }
          }}
          disabled={libraryData.status === 'loading'}
          className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{ 
            background: libraryData.count > 0 ? 'rgba(46, 125, 50, 0.08)' : 'var(--color-surface)',
            border: libraryData.count > 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-surface-secondary)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div className="text-left">
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>도서관</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {libraryData.status === 'loading' ? '조회 중...' :
                 libraryData.status === 'error' ? '조회 실패' :
                 libraryData.count > 0 ? `${regionName} ${libraryData.count}개 도서관 보유` : 
                 `${regionName} 미보유`}
              </div>
            </div>
          </div>
          {libraryData.count > 0 && (
            <span className="text-xl" style={{ color: 'var(--color-primary)' }}>→</span>
          )}
        </button>

        {/* Daangn Option */}
        <button
          onClick={() => openLink(daangnLinks.webUrl)}
          className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{ 
            background: 'rgba(255, 107, 0, 0.08)',
            border: '1px solid rgba(255, 107, 0, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥕</span>
            <div className="text-left">
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>당근마켓</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                내 동네에서 검색하기
              </div>
            </div>
          </div>
          <span className="text-xl" style={{ color: '#FF6B00' }}>→</span>
        </button>

        {/* Aladin Option */}
        <button
          onClick={() => openLink(aladinLink)}
          className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{ 
            background: 'rgba(103, 58, 183, 0.08)',
            border: '1px solid rgba(103, 58, 183, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div className="text-left">
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>알라딘 중고</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                온라인/오프라인 재고 확인
              </div>
            </div>
          </div>
          <span className="text-xl" style={{ color: '#673AB7' }}>→</span>
        </button>

        {/* New Book Option */}
        <button
          onClick={() => openLink(naverLink)}
          className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]"
          style={{ 
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-secondary)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div className="text-left">
              <div className="font-semibold" style={{ color: 'var(--color-text)' }}>새책 구매</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                온라인 최저가 비교
              </div>
            </div>
          </div>
          <span className="text-xl" style={{ color: 'var(--color-text-muted)' }}>→</span>
        </button>
      </div>
    </div>
  );
}
