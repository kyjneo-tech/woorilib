'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { PeerDashboard } from '@/features/peer-comparison';
import { ChallengeSection } from '@/features/challenge';
import { GrowthChart } from '@/features/reading-record';
import { useStats } from '@/features/stats/lib/use-stats';

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading, getMonthlyData } = useStats(isAuthenticated);
  
  const [activeTab, setActiveTab] = useState<'my' | 'peer' | 'challenge'>('my');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin text-4xl">📊</div>
      </div>
    );
  }

  const monthlyData = getMonthlyData();
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            📊 독서 통계
          </h1>
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'my' ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === 'my' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: activeTab === 'my' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              내 통계
            </button>
            <button
              onClick={() => setActiveTab('peer')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'peer' ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === 'peer' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: activeTab === 'peer' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              또래 비교
            </button>
            <button
              onClick={() => setActiveTab('challenge')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'challenge' ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === 'challenge' ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                color: activeTab === 'challenge' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              챌린지
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Peer Comparison Tab */}
        {activeTab === 'peer' && <PeerDashboard />}

        {/* Challenge Tab */}
        {activeTab === 'challenge' && <ChallengeSection showBadges />}

        {/* My Stats Tab */}
        {activeTab === 'my' && (
          <>
        {/* Quick Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <span className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {stats.finished}
            </span>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>완독한 책</p>
          </div>
          <div className="card p-4 text-center">
            <span className="text-4xl font-bold" style={{ color: 'var(--color-secondary)' }}>
              {stats.thisMonth}
            </span>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>이번 달</p>
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="card p-4">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            책장 현황
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>💛 읽고싶음</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{stats.wantToRead}권</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>📖 읽는중</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{stats.reading}권</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>✅ 완독</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{stats.finished}권</span>
            </div>
          </div>
        </section>

        {/* Monthly Chart */}
        <section className="card p-4">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            월별 완독 현황
          </h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t-lg transition-all"
                  style={{ 
                    height: `${Math.max((data.count / maxCount) * 100, 8)}%`,
                    background: data.count > 0 ? 'var(--color-primary)' : 'var(--color-surface-secondary)',
                  }}
                />
                <span className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {data.month}
                </span>
                {data.count > 0 && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {data.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Streak */}
        <section className="card p-4 text-center">
          <span className="text-3xl">🔥</span>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            {stats.streak}개월 연속
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            매달 책을 완독하고 있어요!
          </p>
        </section>

        {/* Growth Chart from Reading Records */}
        <section>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            📊 독서 기록 성장
          </h2>
          <GrowthChart showReactions />
        </section>

        {/* Empty State */}
        {stats.total === 0 && (
          <section className="text-center py-8">
            <span className="text-5xl mb-4 block">📚</span>
            <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              아직 책장이 비어있어요
            </p>
            <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
              책을 추가하고 독서 기록을 시작해보세요
            </p>
            <Link
              href="/home"
              className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              책 둘러보기
            </Link>
          </section>
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
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>책장</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center gap-1">
            <span className="text-xl">📊</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>통계</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}