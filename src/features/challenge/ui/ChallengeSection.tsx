'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { challengeService } from '../lib/challenge.service';
import { Challenge, UserChallenge, Badge } from '../lib/types';
import { ChallengeCard } from './ChallengeCard';
import { BadgeGrid } from './BadgeGrid';

interface ChallengeSectionProps {
  showBadges?: boolean;
}

/**
 * 챌린지 섹션 컴포넌트
 */
export function ChallengeSection({ showBadges = true }: ChallengeSectionProps) {
  const { getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [challengeList, userChallengeList, badgeList] = await Promise.all([
        challengeService.getChallenges(),
        challengeService.getUserChallenges(selectedChild?.id).catch(() => []),
        showBadges ? challengeService.getBadges(selectedChild?.id).catch(() => []) : Promise.resolve([]),
      ]);

      setChallenges(challengeList);
      setUserChallenges(userChallengeList);
      setBadges(badgeList);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChild?.id, showBadges]);

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await challengeService.joinChallenge(challengeId, selectedChild?.id);
      loadData();
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin text-3xl">🏆</div>
      </div>
    );
  }

  // 챌린지와 유저 챌린지 매칭
  const getChallengeWithProgress = (challenge: Challenge): UserChallenge | undefined => {
    return userChallenges.find((uc) => uc.challengeId === challenge.id);
  };

  // 진행 중인 챌린지
  const activeChallenges = challenges.filter((c) => {
    const uc = getChallengeWithProgress(c);
    return uc && !uc.completedAt;
  });

  // 완료된 챌린지
  const completedChallenges = challenges.filter((c) => {
    const uc = getChallengeWithProgress(c);
    return uc && uc.completedAt;
  });

  // 참여하지 않은 챌린지
  const availableChallenges = challenges.filter((c) => !getChallengeWithProgress(c));

  return (
    <div className="space-y-6">
      {/* 뱃지 그리드 */}
      {showBadges && badges.length > 0 && (
        <section>
          <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            🏅 획득한 뱃지
          </h3>
          <BadgeGrid badges={badges} />
        </section>
      )}

      {/* 진행 중인 챌린지 */}
      {activeChallenges.length > 0 && (
        <section>
          <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            🔥 진행 중
          </h3>
          <div className="space-y-3">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getChallengeWithProgress(challenge)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 완료된 챌린지 */}
      {completedChallenges.length > 0 && (
        <section>
          <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            ✅ 완료
          </h3>
          <div className="space-y-3">
            {completedChallenges.slice(0, 3).map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getChallengeWithProgress(challenge)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 참여 가능한 챌린지 */}
      {availableChallenges.length > 0 && (
        <section>
          <h3 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            🎯 도전해보세요
          </h3>
          <div className="space-y-3">
            {availableChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={() => handleJoinChallenge(challenge.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 비어있음 */}
      {challenges.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">🎯</span>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            아직 챌린지가 없어요
          </p>
        </div>
      )}
    </div>
  );
}
