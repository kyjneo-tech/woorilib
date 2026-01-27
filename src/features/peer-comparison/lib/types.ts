/**
 * 또래 비교 관련 타입 정의
 */

export interface PeerComparisonData {
  myTotalBooks: number;       // 내 자녀 총 독서량
  myThisMonthBooks: number;   // 내 자녀 이번 달 독서량
  peerAvgTotal: number;       // 또래 평균 총 독서량
  peerAvgMonth: number;       // 또래 평균 이번 달 독서량
  peerCount: number;          // 비교 대상 또래 수
  percentile: number;         // 상위 몇 % (1~100)
}

export interface PeerPopularBook {
  isbn: string;
  bookTitle: string;
  bookAuthor: string | null;
  bookCover: string | null;
  readCount: number;
}

/**
 * 백분위에 따른 메시지 반환
 */
export function getPercentileMessage(percentile: number): {
  emoji: string;
  message: string;
  subMessage: string;
} {
  if (percentile >= 90) {
    return {
      emoji: '🏆',
      message: '대단해요!',
      subMessage: `또래 중 상위 ${100 - percentile}%에 해당해요`,
    };
  } else if (percentile >= 70) {
    return {
      emoji: '⭐',
      message: '잘하고 있어요!',
      subMessage: `또래 중 상위 ${100 - percentile}%에 해당해요`,
    };
  } else if (percentile >= 50) {
    return {
      emoji: '📚',
      message: '평균 이상이에요!',
      subMessage: '조금만 더 노력하면 상위권!',
    };
  } else if (percentile >= 30) {
    return {
      emoji: '🌱',
      message: '성장 중이에요!',
      subMessage: '꾸준히 읽으면 곧 따라잡을 거예요',
    };
  } else {
    return {
      emoji: '💪',
      message: '함께 시작해요!',
      subMessage: '오늘부터 한 권씩 읽어볼까요?',
    };
  }
}

/**
 * 비교 결과에 따른 차이 표시
 */
export function getComparisonDiff(myValue: number, peerAvg: number): {
  diff: number;
  isAhead: boolean;
  text: string;
} {
  const diff = myValue - peerAvg;
  const isAhead = diff >= 0;
  const absDiff = Math.abs(diff).toFixed(1);

  return {
    diff,
    isAhead,
    text: isAhead
      ? `또래보다 ${absDiff}권 더 읽었어요`
      : `또래보다 ${absDiff}권 적게 읽었어요`,
  };
}
