'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/entities/user/model/user-store';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { AGE_GROUPS } from '@/shared/config/constants';
import { RegionSelector } from '@/features/region-selector/ui/region-selector';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { 
    childAgeGroup, 
    regionCode, 
    regionName,
    setChildAgeGroup, 
    setRegion 
  } = useUserStore();
  
  const [showAgeModal, setShowAgeModal] = useState(false);

  const currentAgeGroup = AGE_GROUPS.find(g => g.id === childAgeGroup);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            ⚙️ 설정
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User Section */}
        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            내 정보
          </h2>
          
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" 
                  style={{ background: 'var(--color-surface-secondary)' }}>
                  👤
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {user?.email}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    로그인됨
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text-muted)' }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl text-center font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              로그인하기
            </Link>
          )}
        </section>

        {/* Child Settings */}
        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            자녀 설정
          </h2>
          
          <button
            onClick={() => setShowAgeModal(true)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl mb-2"
            style={{ background: 'var(--color-surface-secondary)' }}
          >
            <span style={{ color: 'var(--color-text)' }}>자녀 나이</span>
            <span className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              {currentAgeGroup?.label || '선택 안함'}
              <span>→</span>
            </span>
          </button>
          
          <Link
            href="/settings/family"
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'var(--color-surface-secondary)' }}
          >
            <span style={{ color: 'var(--color-text)' }}>👨‍👩‍👧‍👦 가족 구성원 관리</span>
            <span className="text-gray-400">→</span>
          </Link>
        </section>

        {/* Region Settings */}
        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            지역 설정
          </h2>
          
          <RegionSelector />
          
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            도서관 검색 및 중고 매물 검색에 사용됩니다. 현재 시/도 단위 뿐 아니라 시/군/구 단위까지 상세 설정이 가능합니다.
          </p>
        </section>

        {/* App Info */}
        <section className="card p-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            앱 정보
          </h2>
          <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex justify-between">
              <span>버전</span>
              <span>0.1.0 (Beta)</span>
            </div>
            <div className="flex justify-between">
              <span>문의</span>
              <a href="mailto:hello@woorilib.com" style={{ color: 'var(--color-primary)' }}>
                hello@woorilib.com
              </a>
            </div>
          </div>
        </section>
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
                    setChildAgeGroup(group.id);
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
          <Link href="/settings" className="flex flex-col items-center gap-1">
            <span className="text-xl">⚙️</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>설정</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
