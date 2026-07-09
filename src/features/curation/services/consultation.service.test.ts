import { ConsultationService } from './consultation.service';
import { prisma } from '@/shared/lib/prisma';
import { PrismaClient } from '@prisma/client';

// 1. Mock the module
jest.mock('@/shared/lib/prisma', () => ({
    prisma: {
        childProfile: {
            findUnique: jest.fn(),
        },
        bookshelf: {
            findMany: jest.fn(),
        },
        verified_books: {
            findMany: jest.fn(),
        }
    }
}));

// Mock RuleService
jest.mock('./rule.service', () => ({
    RuleService: {
        getRules: jest.fn().mockResolvedValue({
            subCompetencies: {
                '공룡': ['공룡', '티라노'],
                '친구': ['친구', '우정'],
                '한글': ['가나다', '한글']
            },
            parentAreas: {
                '공룡': '자연탐구',
                '친구': '사회관계',
                '한글': '의사소통'
            }
        })
    }
}));

// 2. Helper to get the mock with types
const prismaMock = prisma as unknown as {
    childProfile: { findUnique: jest.Mock },
    bookshelf: { findMany: jest.Mock },
    verified_books: { findMany: jest.Mock }
};

describe('ConsultationService', () => {
    const mockChildId = 'child-123';
    const mockProfile = {
        id: mockChildId,
        userId: 'user-123',
        name: 'Test Child',
        birthYear: 2020,
        interests: ['공룡'],
        propensity: 'active',
        emoji: '🐥',
        ageGroup: '3-5',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockBooks = [
        { id: '1', title: '공룡 점박이', domain: '자연탐구', status: 'reading' },
        { id: '2', title: '백설공주', domain: '의사소통', status: 'completed' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate a consultation report correctly', async () => {
        // Arrange
        prismaMock.childProfile.findUnique.mockResolvedValue(mockProfile);
        prismaMock.bookshelf.findMany.mockResolvedValue(mockBooks);
        
        // Mock Verified Books corresponding to Shelf
        const mockVerifiedBooks = [
            { id: '1', title: '공룡 점박이', developmental_areas: ['자연탐구'], isbn13: '111', tags: [] },
            { id: '2', title: '백설공주', developmental_areas: ['의사소통'], isbn13: '222', tags: [] }
        ];
        prismaMock.verified_books.findMany.mockResolvedValue(mockVerifiedBooks); 

        // Act
        const report = await ConsultationService.generateReport(mockChildId);

        // Assert
        expect(report).toBeDefined();
        expect(report.childName).toBe('Test Child');
        expect(report.totalBooks).toBe(mockVerifiedBooks.length); // Should match verified count
        expect(report.balanceScore).toBeDefined();

        expect(prismaMock.childProfile.findUnique).toHaveBeenCalledWith({
            where: { id: mockChildId }
        });
    });

    it('should identify weak areas and recommend bridging books', async () => {
        // Arrange
        const specializedBooks = [
            { id: '1', title: 'Dino 1', domain: '자연탐구' },
            { id: '2', title: 'Dino 2', domain: '자연탐구' },
            { id: '3', title: 'Dino 3', domain: '자연탐구' },
            { id: '4', title: 'Dino 4', domain: '자연탐구' },
            { id: '5', title: 'Dino 5', domain: '자연탐구' },
            { id: '6', title: 'Dino 6', domain: '자연탐구' },
        ];
        prismaMock.childProfile.findUnique.mockResolvedValue(mockProfile); 
        prismaMock.bookshelf.findMany.mockResolvedValue(specializedBooks);

        const mockBridgingBooks = [
            { id: 'b1', title: 'Communication Dino', developmental_areas: ['의사소통'], cover_url: 'url', tags: ['공룡'] }
        ];
        prismaMock.verified_books.findMany.mockResolvedValue(mockBridgingBooks);

        // Act
        const report = await ConsultationService.generateReport(mockChildId);

        // Assert
        expect(report.interestExpansion).toBeDefined();
        expect(prismaMock.verified_books.findMany).toHaveBeenCalled();
    });
});