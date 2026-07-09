'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConsultationReport } from '@/features/report/ui/ConsultationReport';
import { useUserStore } from '@/entities/user/model/user-store';
import type { BookItem } from '@/features/curation/engine/display/shelf-composer';

interface ReportData {
    childName: string;
    ageGroup: string;
    scores: { area: string; score: number }[];
    analysis: {
        strength: string[];
        weakness: string[];
        comment: string;
    };
    recommendations: {
        reason: string;
        books: BookItem[];
    }[];
}

export default function ReportPage() {
    const { childName, birthYear, gender, propensity, interests } = useUserStore();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReport() {
            try {
                setLoading(true);
                // Build query params from user store
                const params = new URLSearchParams();
                if (childName) params.append('name', childName);
                if (birthYear) params.append('birthYear', birthYear.toString());
                if (gender) params.append('gender', gender);
                if (propensity) params.append('propensity', propensity);
                if (interests.length > 0) params.append('interests', interests.join(','));

                const res = await fetch(`/api/curation/report?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch report');

                const data = await res.json();
                setReport(data);
            } catch (err) {
                console.error(err);
                setError('리포트를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [childName, birthYear, gender, propensity, interests]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="animate-spin text-4xl">📚</div>
                    <p className="text-gray-500 font-medium">우리 아이 독서 데이터를 분석하고 있어요...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="text-4xl">⚠️</div>
                    <p className="text-red-500 font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        다시 시도하기
                    </button>
                </div>
            </div>
        );
    }

    if (!report) return null;

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <ConsultationReport report={report} />
        </main>
    );
}
