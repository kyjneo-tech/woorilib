'use client';

import { Badge } from '../lib/types';

interface BadgeGridProps {
  badges: Badge[];
  className?: string;
}

/**
 * 뱃지 그리드 컴포넌트
 */
export function BadgeGrid({ badges, className }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <span className="text-4xl mb-2 block">🎖️</span>
        <p className="text-sm">아직 획득한 뱃지가 없어요</p>
        <p className="text-xs text-gray-400">챌린지를 완료하면 뱃지를 받을 수 있어요!</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
        >
          <span className="text-3xl mb-1">{badge.badgeEmoji}</span>
          <span className="text-[10px] text-center font-medium text-gray-700 line-clamp-2">
            {badge.badgeName}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 미니 뱃지 리스트 (프로필용)
 */
export function BadgeList({ badges, max = 5 }: { badges: Badge[]; max?: number }) {
  const displayBadges = badges.slice(0, max);
  const remaining = badges.length - max;

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map((badge) => (
        <span key={badge.id} className="text-lg" title={badge.badgeName}>
          {badge.badgeEmoji}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500">+{remaining}</span>
      )}
    </div>
  );
}
