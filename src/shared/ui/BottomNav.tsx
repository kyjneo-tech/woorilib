'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/home', label: '홈', emoji: '🏠' },
    { href: '/curation/roadmap', label: '로드맵', emoji: '📊' },
    { href: '/search', label: '검색', emoji: '🔍' },
    { href: '/my-bookshelf', label: '책장', emoji: '📚' },
    { href: '/settings', label: '설정', emoji: '⚙️' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t z-50"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-surface-secondary)' }}
    >
      <div className="max-w-2xl mx-auto flex justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 transition-all active:scale-95">
              <span className={`text-xl ${isActive ? 'scale-110' : 'grayscale opacity-70'}`}>{tab.emoji}</span>
              <span 
                className={`text-[10px] font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
