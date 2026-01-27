import { createBrowserClient } from '@/shared/lib/supabase/client';
import { Challenge, UserChallenge, Badge } from './types';

/**
 * 챌린지 & 뱃지 서비스
 */
class ChallengeService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 활성 챌린지 목록 조회
   */
  async getChallenges(): Promise<Challenge[]> {
    const supabase = this.getSupabase();

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('type');

    if (error) throw error;

    return (data || []).map(this.mapToChallenge);
  }

  /**
   * 사용자의 챌린지 진행 상황 조회
   */
  async getUserChallenges(childId?: string): Promise<UserChallenge[]> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    let query = supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', user.id);

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item) => ({
      ...this.mapToUserChallenge(item),
      challenge: item.challenges ? this.mapToChallenge(item.challenges) : undefined,
    }));
  }

  /**
   * 챌린지 시작 (참여)
   */
  async joinChallenge(challengeId: string, childId?: string): Promise<UserChallenge> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase
      .from('user_challenges')
      .upsert({
        user_id: user.id,
        child_id: childId || null,
        challenge_id: challengeId,
        progress: 0,
      }, {
        onConflict: 'user_id,child_id,challenge_id',
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToUserChallenge(data);
  }

  /**
   * 챌린지 진행 업데이트
   * (독서 기록 추가 시 자동 호출)
   */
  async updateProgress(
    challengeId: string,
    progress: number,
    childId?: string
  ): Promise<UserChallenge> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    // 현재 챌린지 정보 조회
    const { data: challenge } = await supabase
      .from('challenges')
      .select('goal')
      .eq('id', challengeId)
      .single();

    const isComplete = challenge && progress >= challenge.goal;

    const { data, error } = await supabase
      .from('user_challenges')
      .update({
        progress,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .eq('child_id', childId || null)
      .select()
      .single();

    if (error) throw error;
    return this.mapToUserChallenge(data);
  }

  /**
   * 사용자 뱃지 목록 조회
   */
  async getBadges(childId?: string): Promise<Badge[]> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    let query = supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapToBadge);
  }

  /**
   * 뱃지 획득
   */
  async earnBadge(badgeEmoji: string, badgeName: string, childId?: string): Promise<Badge> {
    const supabase = this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    // 이미 획득했는지 확인
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', user.id)
      .eq('badge_name', badgeName)
      .eq('child_id', childId || null)
      .single();

    if (existing) {
      throw new Error('이미 획득한 뱃지입니다');
    }

    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: user.id,
        child_id: childId || null,
        badge_emoji: badgeEmoji,
        badge_name: badgeName,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToBadge(data);
  }

  private mapToChallenge(data: any): Challenge {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      goal: data.goal,
      badgeEmoji: data.badge_emoji,
      badgeName: data.badge_name,
      isActive: data.is_active,
    };
  }

  private mapToUserChallenge(data: any): UserChallenge {
    return {
      id: data.id,
      userId: data.user_id,
      childId: data.child_id,
      challengeId: data.challenge_id,
      progress: data.progress,
      completedAt: data.completed_at,
      createdAt: data.created_at,
    };
  }

  private mapToBadge(data: any): Badge {
    return {
      id: data.id,
      userId: data.user_id,
      childId: data.child_id,
      badgeEmoji: data.badge_emoji,
      badgeName: data.badge_name,
      earnedAt: data.earned_at,
    };
  }
}

export const challengeService = new ChallengeService();
