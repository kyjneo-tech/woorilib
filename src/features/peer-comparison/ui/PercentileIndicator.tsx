'use client';

import { getPercentileMessage } from '../lib/types';

interface PercentileIndicatorProps {
  percentile: number;
  peerCount: number;
}

/**
 * 백분위 시각적 표시 컴포넌트
 */
export function PercentileIndicator({ percentile, peerCount }: PercentileIndicatorProps) {
  const { emoji, message, subMessage } = getPercentileMessage(percentile);

  // 백분위 바 색상 결정
  const getBarColor = () => {
    if (percentile >= 70) return 'var(--color-primary)';
    if (percentile >= 50) return 'var(--color-secondary)';
    return 'var(--color-text-muted)';
  };

  return (
    <div className="text-center">
      {/* 이모지 & 메시지 */}
      <div className="text-5xl mb-3">{emoji}</div>
      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        {message}
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {subMessage}
      </p>

      {/* 백분위 바 */}
      <div className="relative h-4 rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-surface-secondary)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentile}%`,
            background: getBarColor(),
          }}
        />
        {/* 현재 위치 마커 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 transition-all duration-500"
          style={{
            left: `${percentile}%`,
            transform: 'translate(-50%, -50%)',
            borderColor: getBarColor(),
          }}
        />
      </div>

      {/* 라벨 */}
      <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>0%</span>
        <span className="font-medium" style={{ color: getBarColor() }}>상위 {100 - percentile}%</span>
        <span>100%</span>
      </div>

      {/* 비교 인원 */}
      {peerCount > 0 && (
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
          {peerCount}명의 또래와 비교했어요
        </p>
      )}
    </div>
  );
}
