'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { bookshelfService, BookshelfItem, BookshelfStatus } from '@/features/bookshelf/lib/bookshelf-service';
import { ReadingTimeline } from '@/features/reading-record';

type ViewMode = 'bookshelf' | 'timeline';

const STATUS_TABS: { key: BookshelfStatus | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: '전체', emoji: '📚' },
  { key: 'want_to_read', label: '읽고싶음', emoji: '💛' },
  { key: 'reading', label: '읽는중', emoji: '📖' },
  { key: 'finished', label: '완독', emoji: '✅' },
];

export default function MyBookshelfPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('bookshelf');
  const [activeTab, setActiveTab] = useState<BookshelfStatus | 'all'>('all');
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
  }, [isAuthenticated, authLoading, activeTab]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const items = await bookshelfService.getMyBooks(
        activeTab === 'all' ? undefined : activeTab
      );
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
      <header className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              📚 내 책장
            </h1>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {books.length}권
            </span>
          </div>
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('bookshelf')}
              className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'bookshelf' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: viewMode === 'bookshelf' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              📚 책장
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className="flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'timeline' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: viewMode === 'timeline' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              📅 타임라인
            </button>
          </div>
        </div>
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
                {tab.emoji} {tab.label}
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
                  아직 책이 없어요
                </p>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  책 상세 페이지에서 "책장에 담기"를 눌러보세요
                </p>
                <Link
                  href="/home"
                  className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  책 둘러보기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div key={book.id} className="card p-4 flex gap-4">
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
                        {STATUS_TABS.slice(1).map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => handleStatusChange(book.isbn, tab.key as BookshelfStatus)}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: book.status === tab.key ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                              color: book.status === tab.key ? 'white' : 'var(--color-text-muted)',
                            }}
                          >
                            {tab.emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => handleRemove(book.isbn)}
                          className="px-2 py-1 rounded text-xs ml-auto"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-surface-secondary)' }}
      >
        <div className="max-w-2xl mx-auto flex justify-around">
          <Link href="/home" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>홈</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>검색</span>
          </Link>
          <Link href="/my-bookshelf" className="flex flex-col items-center gap-1">
            <span className="text-xl">📚</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>책장</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center gap-1">
            <span className="text-xl">📊</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>통계</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
