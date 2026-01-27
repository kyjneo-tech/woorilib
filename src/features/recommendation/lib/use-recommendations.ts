'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/entities/user/model/user-store';
import { recommendationService, RecommendedBook } from '@/features/recommendation/lib/recommendation-service';

interface UseRecommendationsResult {
  recommendations: RecommendedBook[];
  peerReading: RecommendedBook[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRecommendations(): UseRecommendationsResult {
  const { childAgeGroup, regionCode } = useUserStore();
  
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [peerReading, setPeerReading] = useState<RecommendedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!childAgeGroup) {
      // No age group set, skip fetching
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [recs, peer] = await Promise.all([
        recommendationService.getRecommendations({
          ageGroup: childAgeGroup,
          region: regionCode,
          limit: 10,
        }),
        recommendationService.getPeerReading({
          ageGroup: childAgeGroup,
          region: regionCode,
          limit: 10,
        }),
      ]);

      setRecommendations(recs);
      setPeerReading(peer);
    } catch (err) {
      console.error('[useRecommendations] Error:', err);
      setError('추천 도서를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [childAgeGroup, regionCode]);

  return {
    recommendations,
    peerReading,
    isLoading,
    error,
    refetch: fetchRecommendations,
  };
}
