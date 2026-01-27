'use client';

import { Challenge, UserChallenge, calculateProgress, isCompleted } from '../lib/types';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onJoin?: () => void;
}

/**
 * 챌린지 카드 컴포넌트
 */
export function ChallengeCard({ challenge, userChallenge, onJoin }: ChallengeCardProps) {
  const progress = userChallenge?.progress || 0;
  const progressPercent = calculateProgress(progress, challenge.goal);
  const completed = isCompleted(progress, challenge.goal);

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        completed
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-green-300'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{challenge.badgeEmoji}</span>
          <div>
            <h3 className="font-bold text-gray-900">{challenge.title}</h3>
            <p className="text-xs text-gray-500">{challenge.description}</p>
          </div>
        </div>
        {completed && (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            완료!
          </span>
        )}
      </div>

      {/* 진행 바 */}
      <div className="mb-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completed ? 'bg-green-500' : 'bg-green-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 진행 상태 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {progress} / {challenge.goal}
        </span>
        {!userChallenge && onJoin && (
          <button
            onClick={onJoin}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
          >
            참여하기
          </button>
        )}
        {completed && (
          <span className="text-green-600 font-medium">
            🏆 {challenge.badgeName} 획득!
          </span>
        )}
      </div>
    </div>
  );
}
