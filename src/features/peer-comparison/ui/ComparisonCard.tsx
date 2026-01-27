'use client';

import { getComparisonDiff } from '../lib/types';

interface ComparisonCardProps {
  label: string;
  myValue: number;
  peerAvg: number;
  icon: string;
  unit?: string;
}

/**
 * 또래 비교 카드 컴포넌트
 */
export function ComparisonCard({ label, myValue, peerAvg, icon, unit = '권' }: ComparisonCardProps) {
  const { isAhead, text } = getComparisonDiff(myValue, peerAvg);

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      </div>

      {/* 비교 값 */}
      <div className="flex items-end gap-4 mb-2">
        {/* 내 값 */}
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>우리 아이</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {myValue}<span className="text-sm font-normal ml-0.5">{unit}</span>
          </p>
        </div>

        {/* vs */}
        <div className="text-lg mb-1" style={{ color: 'var(--color-text-muted)' }}>vs</div>

        {/* 또래 평균 */}
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>또래 평균</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            {peerAvg.toFixed(1)}<span className="text-sm font-normal ml-0.5">{unit}</span>
          </p>
        </div>
      </div>

      {/* 차이 메시지 */}
      <p
        className="text-xs font-medium"
        style={{ color: isAhead ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
      >
        {isAhead ? '👍 ' : '📈 '}{text}
      </p>
    </div>
  );
}

/**
 * 간단 통계 카드
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  unit?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, icon, unit = '권', highlight = false }: StatCardProps) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: highlight ? 'var(--color-primary-light)' : 'var(--color-surface)',
      }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold" style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text)' }}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  );
}
