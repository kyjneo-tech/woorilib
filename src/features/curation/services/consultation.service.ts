

import { DevelopmentalArea, DEVELOPMENTAL_AREAS } from '@/shared/config/constants';
import { prisma } from '@/shared/lib/prisma';
import { BookClassifier } from '../core/classifiers/book-classifier';
import { calculateAgeMonths } from '@/shared/lib/child-logic';

// Types
export interface ConsultationReport {
    childName: string;
    ageMonths: number;
    totalBooks: number;
    matrix: SixAreaMatrix;
    balanceScore: Record<string, number>; // 0~100
    missingAreas: string[];
    interestExpansion: RecommendationItem[];
    professionalComment: string;
}

export type SixAreaMatrix = {
    [key in DevelopmentalArea]: {
        current: MatrixItem[]; // Current Level (Age appropriate)
        next: MatrixItem[];    // Next Level (Challenge)
    };
};

export interface MatrixItem {
    id: string;
    title: string;
    coverUrl?: string;
    isOwned: boolean;
    subCompetencies?: string[];
}

export interface RecommendationItem {
    book: MatrixItem;
    reason: string;
    aiComment?: string;
}

export interface ConsultationBookInput {
    id: string;
    title: string;
    isbn13: string;
    cover_url?: string | null;
    developmental_areas?: string[] | null;
    sub_competencies?: string[] | null;
    tags?: string[];
    energy_level?: number | null;
    ai_comment?: string | null;
}

export class ConsultationService {
    constructor(private classifier: BookClassifier) { } 

    /**
     * Generates a comprehensive consultation report for a child.
     * Uses high-precision metadata from verified_books for deterministic results.
     */
    static async generateReport(childId: string): Promise<ConsultationReport> {
        // 1. Fetch Child Profile
        const profile = await prisma.childProfile.findUnique({
            where: { id: childId }
        });

        if (!profile) throw new Error('Child profile not found');

        // Fetch User's Bookshelf with Metadata
        const ownedBooksInShelf = await prisma.bookshelf.findMany({
            where: {
                userId: profile.userId,
                status: { not: 'want_to_read' }
            }
        });

        // Match with verified_books to get professional metadata
        const isbns = ownedBooksInShelf.map((b) => b.isbn);
        const verifiedOwnedBooks = await prisma.verified_books.findMany({
            where: { isbn13: { in: isbns } }
        });

        // Map Prisma Profile to Domain Profile
        const domainProfile = {
            name: profile.name,
            birthYear: profile.birthYear,
            gender: (profile as any).gender,
            propensity: profile.propensity,
            interests: profile.interests,
        };

        // verifiedOwnedBooks matches the structure we need
        return this.calculateReport(domainProfile, verifiedOwnedBooks as unknown as ConsultationBookInput[]);
    }

    /**
     * Pure domain logic for generating report from profile and books
     */
    static async calculateReport(
        profile: {
            name: string;
            birthYear?: number | null;
            gender?: string | null;
            propensity?: string | null;
            interests?: string[];
        },
        books: ConsultationBookInput[]
    ): Promise<ConsultationReport> {
        // Calculate Age Months using standard logic
        const ageMonths = calculateAgeMonths(profile.birthYear || new Date().getFullYear());

        // 2. Classify into Matrix
        const matrix = {} as SixAreaMatrix;
        const areaCounts: Record<string, number> = {};
        DEVELOPMENTAL_AREAS.forEach(area => {
            matrix[area] = { current: [], next: [] };
            areaCounts[area] = 0;
        });

        books.forEach((book) => {
            const areas = (book.developmental_areas as string[]) || [];
            areas.forEach(area => {
                if (DEVELOPMENTAL_AREAS.includes(area as any)) {
                    areaCounts[area]++;
                    matrix[area as DevelopmentalArea].current.push({
                        id: book.id,
                        title: book.title,
                        coverUrl: book.cover_url || undefined,
                        isOwned: true,
                        subCompetencies: book.sub_competencies || []
                    });
                }
            });
        });

        // 3. Analyze Balance
        const totalBooks = books.length;
        const balanceScore: Record<string, number> = {};
        const missingAreas: string[] = [];

        DEVELOPMENTAL_AREAS.forEach(area => {
            const count = areaCounts[area];
            const ratio = totalBooks > 0 ? count / totalBooks : 0;
            balanceScore[area] = Math.round(ratio * 100);
            if (ratio < 0.15) missingAreas.push(area);
        });

        // 4. Interest & Propensity Matching Logic
        const interestExpansion: RecommendationItem[] = [];
        const primaryInterest = (profile.interests && profile.interests.length > 0) ? profile.interests[0] : null;
        const targetArea = missingAreas.length > 0 ? missingAreas[0] : DEVELOPMENTAL_AREAS[0];
        const ownedIsbns = books.map(b => b.isbn13).filter(Boolean);

        // Fetch candidates
        const candidateBooks = await prisma.verified_books.findMany({
            where: {
                developmental_areas: { has: targetArea },
                isbn13: { notIn: ownedIsbns }
            },
            take: 20
        });

        const scoredBooks = candidateBooks.map((book) => {
            let score = 0;
            const tags = (book.tags as string[]) || [];
            if (primaryInterest && (tags.includes(primaryInterest) || book.title.includes(primaryInterest))) score += 40;
            const energy = book.energy_level || 5;
            if (profile.propensity === 'active' && energy >= 7) score += 30;
            if (profile.propensity === 'calm' && energy <= 4) score += 30;
            if (profile.propensity === 'curious' && (book.sub_competencies as string[] || []).includes('호기심')) score += 30;
            return { book, score };
        }).sort((a, b) => b.score - a.score);

        // Pick top 3
        scoredBooks.slice(0, 3).forEach(({ book, score }) => {
            interestExpansion.push({
                book: {
                    id: book.id,
                    title: book.title,
                    coverUrl: book.cover_url || undefined,
                    isOwned: false,
                    subCompetencies: (book.sub_competencies as string[]) || []
                },
                reason: score > 50
                    ? `${profile.name}의 ${profile.propensity}한 기질과 '${primaryInterest}'에 대한 관심을 동시에 고려했어요.`
                    : `${targetArea} 영역의 균형 잡힌 발달을 위해 추천하는 도서입니다.`,
                aiComment: book.ai_comment || undefined
            });
        });

        // 5. Generate Professional Insight
        let comment = `현재 ${totalBooks}권의 엄선된 도서를 읽고 계시네요.`;
        if (missingAreas.length > 0) {
            comment += ` ${missingAreas.join(', ')} 영역의 비중을 조금 더 높여주시면 완벽한 균형 성장이 가능합니다.`;
        } else {
            comment += ` 모든 영역이 아주 고르게 발달하고 있는 이상적인 독서 환경입니다!`;
        }

        return {
            childName: profile.name,
            ageMonths,
            totalBooks,
            matrix,
            balanceScore,
            missingAreas,
            interestExpansion,
            professionalComment: comment
        };
    }
}
