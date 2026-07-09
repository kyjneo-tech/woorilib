
import { ConsultationService, ConsultationBookInput } from '../src/features/curation/services/consultation.service';

// Mock Prisma
jest.mock('@/shared/lib/prisma', () => ({
    prisma: {
        verified_books: {
            findMany: jest.fn().mockResolvedValue([
                {
                    id: '101',
                    title: 'Recommended Book 1',
                    isbn13: '999',
                    tags: ['cars'],
                    energy_level: 8,
                    developmental_areas: ['SOCIAL'],
                    sub_competencies: []
                }
            ])
        }
    }
}));

async function testConsultation() {
    console.log('Testing ConsultationService.calculateReport...');

    const profile = {
        name: 'Test Child',
        birthYear: 2020,
        gender: 'boy',
        propensity: 'active',
        interests: ['cars']
    };

    const mockLibrary: ConsultationBookInput[] = [
        {
            id: '1',
            title: 'My Book',
            isbn13: '111',
            developmental_areas: ['COGNITIVE'],
            sub_competencies: ['Logic']
        }
    ];

    try {
        const report = await ConsultationService.calculateReport(profile, mockLibrary);
        console.log('Report generated successfully!');
        console.log('Child Name:', report.childName);
        console.log('Total Books:', report.totalBooks);
        console.log('Balance Score:', report.balanceScore);
        console.log('Recommendations:', report.interestExpansion.length);
        console.log('Comment:', report.professionalComment);
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

testConsultation();
