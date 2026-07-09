
'use client';

import { DevelopmentalRadarChart } from './DevelopmentalRadarChart';
import type { BookItem } from '@/features/curation/engine/display/shelf-composer';
import { DomainDetailCard } from './DomainDetailCard';

interface MatrixItem {
    id: string;
    title: string;
    coverUrl?: string;
    isOwned: boolean;
    subCompetencies?: string[];
}

interface Props {
    report: {
        childName: string;
        ageGroup: string;
        scores: { area: string; score: number }[];
        analysis: {
            strength: string[];
            weakness: string[];
            comment: string;
        };
        matrix?: Record<string, { current: MatrixItem[]; next: MatrixItem[] }>;
        recommendations: {
            reason: string;
            books: BookItem[];
        }[];
    };
}

export function ConsultationReport({ report }: Props) {
    // Transform scores for RadarChart
    const radarData = report.scores.map(s => ({
        subject: s.area,
        A: s.score,
        fullMark: 100
    }));

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                    AI 독서 진단 리포트
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                    {report.childName ? `${report.childName} 어린이의` : '우리 아이'} 독서 밸런스
                </h1>
                <p className="text-gray-500">
                    6대 영역 분석을 통해 균형 잡힌 성장을 돕습니다
                </p>
            </div>

            {/* Radar Chart Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 text-center">영역별 발달 균형</h2>
                <DevelopmentalRadarChart data={radarData} />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-5 rounded-2xl">
                        <h3 className="font-bold text-green-800 mb-2">💪 강점 영역</h3>
                        <ul className="list-disc list-inside text-green-700 space-y-1">
                            {report.analysis.strength.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-2xl">
                        <h3 className="font-bold text-orange-800 mb-2">🌱 보완이 필요한 영역</h3>
                        <ul className="list-disc list-inside text-orange-700 space-y-1">
                            {report.analysis.weakness.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Detailed Matrix Analysis (Deep Dive) */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">영역별 심층 분석</h2>
                <div className="grid grid-cols-1 gap-4">
                    {report.scores.map(s => {
                        const matrixData = report.matrix?.[s.area] || { current: [], next: [] };
                        return (
                            <DomainDetailCard
                                key={s.area}
                                area={s.area}
                                score={s.score}
                                currentBooks={matrixData.current}
                                nextBooks={matrixData.next}
                            />
                        );
                    })}
                </div>
            </div>

            {/* AI Comment */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100">
                <div className="flex items-start gap-4">
                    <div className="text-4xl">🤖</div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900 mb-2">AI 전문 컨설턴트의 조언</h3>
                        <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">
                            {report.analysis.comment}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">맞춤 추천 솔루션</h2>
                {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                {idx + 1}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{rec.reason}</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-11">
                            {rec.books.map(book => (
                                <div key={book.id} className="group cursor-pointer">
                                    <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-3 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                        {book.cover_url && (
                                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                                        {book.title}
                                    </div>
                                    {/* Author is not in BookItem interface currently, checking if we can add it or if it's missing */}
                                    {/* book.author is missing from BookItem. We should use mapped data or update interface. */}
                                    {/* For now, let's omit author or cast if we know it's there in runtime, but safer to omit */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
