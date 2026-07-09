'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/entities/user/model/user-store';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { AGE_GROUPS } from '@/shared/config/constants';

import { CurationDashboard } from '@/features/curation/ui/CurationDashboard';
import { RegionSelector } from '@/features/region-selector/ui/region-selector';
import { BottomNav } from '@/shared/ui/BottomNav';
import { AiRecommendSection } from '@/features/ai-recommend/ui/AiRecommendSection';

export default function HomePage() {
  const router = useRouter();
  /* State for Age Modal */
  const [showAgeModal, setShowAgeModal] = useState(false);
  const { childAgeGroup, setChildProfile } = useUserStore();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState(''); // Restore useAuth

  const currentAgeGroup = AGE_GROUPS.find(g => g.id === childAgeGroup);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&age=${childAgeGroup}`);
    }
  };



  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-bold" style={{ color: 'var(--color-primary)' }}>우리아이도서관</span>
          </Link>
          <div className="flex items-center gap-2">
            <RegionSelector variant="compact" />
            {currentAgeGroup && (
              <button
                onClick={() => setShowAgeModal(true)}
                className="text-sm px-3 py-1 rounded-full transition-transform active:scale-95"
                style={{ background: 'rgba(46, 125, 50, 0.1)', color: 'var(--color-primary)' }}
              >
                {currentAgeGroup.label} ✏️
              </button>
            )}
            {isAuthenticated ? (
              <Link
                href="/settings"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                <span>👤</span>
                <span>{user?.email?.split('@')[0] || '마이'}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                <span>🔐</span>
                <span>로그인</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">


        {/* Search Section */}
        <section className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="찾으시는 책 제목이나 작가를 입력하세요"
                className="w-full px-5 py-4 pr-12 text-lg rounded-2xl border-2 border-transparent focus:border-[var(--color-primary)] focus:outline-none transition-all shadow-sm"
                style={{
                  background: 'white',
                  color: 'var(--color-text)',
                }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                style={{
                  background: searchQuery ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  color: searchQuery ? 'white' : 'var(--color-text-muted)',
                }}
              >
                🔍
              </button>
            </div>
          </form>
        </section>

        {/* NEW: AI 맞춤 추천 비서 섹션 */}
        <AiRecommendSection />

        {/* NEW: Curation Dashboard (Exhibition AI) */}
        <CurationDashboard ageGroup={childAgeGroup} />

      </main>

      {/* Age Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAgeModal(false)}>
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              자녀 나이 선택
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {AGE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setChildProfile({ childAgeGroup: group.id });
                    setShowAgeModal(false);
                  }}
                  className="py-4 rounded-xl text-center transition-all"
                  style={{
                    background: childAgeGroup === group.id ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                    color: childAgeGroup === group.id ? 'white' : 'var(--color-text)',
                  }}
                >
                  <span className="text-2xl block mb-1">{group.emoji}</span>
                  <span className="font-semibold">{group.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
