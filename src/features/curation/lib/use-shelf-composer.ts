import { useState, useEffect } from 'react';
import type { DashboardData } from '@/features/curation/engine/display/shelf-composer';

interface UseShelfComposerResult {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
}

export function useShelfComposer(months: number, propensity?: string, interests?: string[]): UseShelfComposerResult {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (months <= 0) return;

        const fetchShelf = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    months: months.toString(),
                });
                if (propensity) params.append('propensity', propensity);
                if (interests && interests.length > 0) params.append('interests', interests.join(','));

                const res = await fetch(`/api/curation/shelf?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch shelf data');

                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error(err);
                setError('큐레이션 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchShelf();
    }, [months, propensity, JSON.stringify(interests)]); // Use simple stable serialization for dependency

    return { data, loading, error };
}
