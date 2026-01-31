'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { useFamily, ChildProfile } from '@/shared/lib/hooks/use-family';
import { bookshelfService, BookshelfItem, BookshelfStatus } from '@/features/bookshelf/lib/bookshelf-service';
import { ReadingTimeline } from '@/features/reading-record';
import { BottomNav } from '@/shared/ui/BottomNav';

type ViewMode = 'bookshelf' | 'timeline';

const STATUS_TABS: { key: BookshelfStatus | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: '전체', emoji: '📚' },
  { key: 'want_to_read', label: '상태:읽고싶음', emoji: '💛' },
  { key: 'reading', label: '상태:읽는중', emoji: '📖' },
  { key: 'finished', label: '상태:완독', emoji: '✅' },
];

export default function MyBookshelfPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { children } = useFamily(); // Fetch Children

  const [viewMode, setViewMode] = useState<ViewMode>('bookshelf');
  const [activeTab, setActiveTab] = useState<BookshelfStatus | 'all'>('all');
  const [activeChildId, setActiveChildId] = useState<string | 'all'>('all'); // Child Filter
  
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBooks();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, activeTab, activeChildId]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      let items: BookshelfItem[] = [];

      // SPECIAL LOGIC: 'Finished' tab uses Reading Record History
      if (activeTab === 'finished') {
          items = await bookshelfService.getReadingHistory(activeChildId === 'all' ? undefined : activeChildId);
      } else {
          // Other tabs use standard Bookshelf (Family Shared)
          // If a child is selected but we are viewing 'Want to Read', currently we show all because Bookshelf doesn't support child assignment yet.
          // We could warn or just show all. Showing all is safer for now.
          items = await bookshelfService.getMyBooks(
            activeTab === 'all' ? undefined : activeTab
          );
          
          // If 'All' tab, we might want to also merge in reading history? 
          // For simplicity, 'All' on Bookshelf View just shows Bookshelf table items.
          // The User requested "Connection", so 'Finished' tab is the key integration point.
      }
      setBooks(items);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (isbn: string, newStatus: BookshelfStatus) => {
    await bookshelfService.updateStatus(isbn, newStatus);
    loadBooks();
  };

  const handleRemove = async (isbn: string) => {
    if (confirm('책장에서 삭제할까요?')) {
      await bookshelfService.removeBook(isbn);
      loadBooks();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin text-4xl">📚</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
         <div className="px-4 py-3 border-b border-gray-100">
             <div className="max-w-2xl mx-auto flex items-center justify-between">
                <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                📚 내 책장
                </h1>
                
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-full">
                    <button
                    onClick={() => setViewMode('bookshelf')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'bookshelf' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}
                    >
                    책장
                    </button>
                    <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}
                    >
                    타임라인
                    </button>
                </div>
            </div>
        </div>

        {/* Child Switcher (Only visible in Bookshelf mode for now) */}
        {viewMode === 'bookshelf' && children.length > 0 && (
            <div className="px-4 py-2 overflow-x-auto border-b border-gray-50">
                <div className="max-w-2xl mx-auto flex gap-2">
                    <button
                        onClick={() => setActiveChildId('all')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeChildId === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        <span>👨‍👩‍👧‍👦</span>
                        <span>가족 전체</span>
                    </button>
                    {children.map(child => (
                        <button
                            key={child.id}
                            onClick={() => setActiveChildId(child.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeChildId === child.id ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                            <span>{child.emoji}</span>
                            <span>{child.name}</span>
                        </button>
                    ))}
                    <Link href="/settings/family" className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-100">
                        + 관리
                    </Link>
                </div>
            </div>
        )}
      </header>

      {/* Bookshelf Tabs */}
      {viewMode === 'bookshelf' && (
        <div className="px-4 py-3 overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
          <div className="max-w-2xl mx-auto flex gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: activeTab === tab.key ? 'white' : 'var(--color-text)',
                }}
              >
                {tab.emoji} {tab.label.replace('상태:', '')}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Timeline View */}
        {viewMode === 'timeline' && <ReadingTimeline showHeader={false} />}

        {/* Bookshelf View */}
        {viewMode === 'bookshelf' && (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin text-4xl">📚</div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-5xl mb-4 block">📚</span>
                <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  {activeTab === 'finished' ? '아직 읽은 책이 없어요' : '아직 책이 없어요'}
                </p>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                   {activeTab === 'finished' ? '"읽었어요" 버튼을 눌러 기록해보세요!' : '책 상세 페이지에서 "책장에 담기"를 눌러보세요'}
                </p>
                <Link
                  href="/home"
                  className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  책 둘러보기
                </Link>
              </div>
            ) : activeTab === 'finished' ? (
                // Monthiy Grid View for Finished
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Active Child Indicator */}
                    {activeChildId !== 'all' && (
                        <div className="bg-green-50 text-green-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm border border-green-100">
                            <span className="text-xl">✅</span>
                            <span>{children.find(c => c.id === activeChildId)?.name} 어린이가 읽은 책들입니다.</span>
                        </div>
                    )}
                    
                    {/* Group by Month */}
                    {Object.entries(books.reduce((acc, book) => {
                        const date = book.finishedAt ? new Date(book.finishedAt) : new Date();
                        const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(book);
                        return acc;
                    }, {} as Record<string, BookshelfItem[]>)).sort((a,b) => b[0].localeCompare(a[0])).map(([month, monthBooks]) => (
                        <div key={month} className="space-y-3">
                            <h3 className="font-bold text-gray-800 text-lg sticky top-32 bg-white/50 backdrop-blur-sm py-2 px-2 z-0 rounded-lg w-max">{month} <span className="text-xs text-gray-400 font-normal ml-1">({monthBooks.length}권)</span></h3>
                            <div className="grid grid-cols-3 gap-3">
                                {monthBooks.map(book => (
                                    <Link key={book.id} href={`/book/${book.isbn}`} className="group relative">
                                        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100 group-hover:scale-105 transition-transform duration-300">
                                            {book.bookImageUrl ? (
                                                <img src={book.bookImageUrl} alt={book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                 <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                                            )}
                                            {/* Overlay Info */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                                                <div className="text-white text-xs font-bold line-clamp-2 leading-tight">{book.title}</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              // Standard List View for Others
              <div className="space-y-3">
                {books.map((book) => (
                  <div key={book.id || book.isbn} className="card p-4 flex gap-4">
                    {/* Cover */}
                    <Link href={`/book/${book.isbn}`} className="flex-shrink-0">
                      <div className="w-16 h-24 rounded-lg overflow-hidden" style={{ background: 'var(--color-surface-secondary)' }}>
                        {book.bookImageUrl ? (
                          <img src={book.bookImageUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/book/${book.isbn}`}>
                        <h3 className="font-semibold line-clamp-1" style={{ color: 'var(--color-text)' }}>
                          {book.title}
                        </h3>
                      </Link>
                      {book.author && (
                        <p className="text-sm line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                          {book.author}
                        </p>
                      )}
                      
                      {/* Status Buttons */}
                      <div className="flex gap-1 mt-2">
                         {activeTab !== 'finished' && STATUS_TABS.slice(1).map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => handleStatusChange(book.isbn, tab.key as BookshelfStatus)}
                            className="px-2 py-1 rounded text-xs transition-colors"
                            style={{
                              background: book.status === tab.key ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                              color: book.status === tab.key ? 'white' : 'var(--color-text-muted)',
                            }}
                          >
                            {tab.emoji}
                          </button>
                        ))} 
                        
                        {activeTab !== 'finished' && (
                            <button
                            onClick={() => handleRemove(book.isbn)}
                            className="px-2 py-1 rounded text-xs ml-auto"
                            style={{ color: 'var(--color-text-muted)' }}
                            >
                            🗑️
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
