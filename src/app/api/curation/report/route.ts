import { NextRequest, NextResponse } from 'next/server';
import { ConsultationService, ConsultationBookInput } from '@/features/curation/services/consultation.service';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;

        // Mock Profile from params
        const profile = {
            name: searchParams.get('name') || '우리아이',
            birthYear: parseInt(searchParams.get('birthYear') || '2020'),
            gender: (searchParams.get('gender') || 'boy') as 'boy' | 'girl',
            propensity: (searchParams.get('propensity') || 'active') as 'active' | 'calm' | 'sensitive' | 'curious',
            interests: (searchParams.get('interests') || '').split(',').filter(Boolean),
            developmentalAreas: []
        };

        // Mock Library (In reality, fetch from database)
        const mockLibrary: ConsultationBookInput[] = [
            {
                id: '1',
                title: '친구와 사이좋게',
                isbn13: '123',
                cover_url: '',
                developmental_areas: ['SOCIAL'],
                sub_competencies: ['Empathy']
            },
            {
                id: '2',
                title: '논리적으로 생각해요',
                isbn13: '456',
                cover_url: '',
                developmental_areas: ['COGNITIVE'],
                sub_competencies: ['Logic']
            },
            {
                id: '3',
                title: '기쁨이 퐁퐁',
                isbn13: '789',
                cover_url: '',
                developmental_areas: ['EMOTION'],
                sub_competencies: ['Joy']
            },
        ];

        const reportData = await ConsultationService.calculateReport(profile, mockLibrary);

        // Transform for UI
        const balanceScore = reportData.balanceScore;

        const scores = Object.entries(balanceScore).map(([area, score]) => ({
            area,
            score
        }));

        const ALL_AREAS = ['SOCIAL', 'EMOTION', 'COGNITIVE', 'PHYSICAL', 'LANGUAGE', 'CREATIVE'];
        ALL_AREAS.forEach(area => {
            if (!scores.find(s => s.area === area)) {
                scores.push({ area, score: 0 });
            }
        });

        const uiReport = {
            childName: reportData.childName,
            ageGroup: `${Math.floor(reportData.ageMonths / 12)} 세`,
            scores,
            analysis: {
                strength: scores.filter(s => s.area && s.score >= 30).slice(0, 2).map(s => s.area),
                weakness: reportData.missingAreas,
                comment: reportData.professionalComment
            },
            matrix: reportData.matrix,
            recommendations: reportData.interestExpansion.map((rec) => ({
                reason: rec.reason,
                books: [{
                    ...rec.book,
                    cover_url: rec.book.coverUrl // Map camelCase to snake_case for UI BookItem
                }]
            }))
        };

        return NextResponse.json(uiReport);
    } catch (error) {
        console.error('Report generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
