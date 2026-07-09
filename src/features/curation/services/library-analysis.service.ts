
import { GrowthDomain } from '@/features/classification/lib/classification.service';
import { RoadmapItem, RoadmapStage, STANDARD_ROADMAP_DATA } from '@/features/curation/config/standard-roadmaps';
import { BookshelfItem } from '@/features/bookshelf/lib/bookshelf-service';

export interface DomainAnalysis {
    domain: GrowthDomain;
    totalCore: number;
    ownedCore: number;
    percentage: number;
    missingBooks: RoadmapItem[];
}

export interface LibraryAnalysisResult {
    totalOwned: number;
    domainAnalysis: Record<GrowthDomain, DomainAnalysis>;
    recommendedBooks: RoadmapItem[]; // Top missing core books
}

export class LibraryAnalysisService {

    /**
     * Analyze the user's library against the standard roadmap for a specific stage
     */
    public analyze(myBooks: BookshelfItem[], stage: RoadmapStage): LibraryAnalysisResult {
        const stageItems = STANDARD_ROADMAP_DATA.filter(item => item.stage === stage);

        // Initialize analysis map
        const domainAnalysis: Record<GrowthDomain, DomainAnalysis> = {
            language: this.createEmptyAnalysis('language'),
            social: this.createEmptyAnalysis('social'),
            math_sci: this.createEmptyAnalysis('math_sci'),
            cognitive: this.createEmptyAnalysis('cognitive'),
            art_music: this.createEmptyAnalysis('art_music'),
            english: this.createEmptyAnalysis('english'),
            unclassified: this.createEmptyAnalysis('unclassified'),
        };

        // Helper to check ownership (ISBN matching or Title fuzzy matching could be added)
        const isOwned = (roadmapItem: RoadmapItem) => {
            // 1. Check ID/ISBN (if mapped) - currently roadmap items have 'id' which might not map directly to ISBN
            // 2. Check Title containment (simple fuzzy match)
            return myBooks.some(book =>
                book.title.replace(/\s/g, '').includes(roadmapItem.title.replace(/\s/g, '')) ||
                (roadmapItem.keywords && roadmapItem.keywords.some(k => book.title.includes(k)))
            );
        };

        // Analyze each item in the stage
        stageItems.forEach(item => {
            if (item.domain === 'unclassified') return;

            const analysis = domainAnalysis[item.domain];

            if (item.priority === 'core') {
                analysis.totalCore++;

                if (isOwned(item)) {
                    analysis.ownedCore++;
                } else {
                    analysis.missingBooks.push(item);
                }
            }
        });

        // Calculate percentages
        Object.values(domainAnalysis).forEach(analysis => {
            if (analysis.totalCore > 0) {
                analysis.percentage = Math.round((analysis.ownedCore / analysis.totalCore) * 100);
            }
        });

        // Collect all missing core books for recommendation
        const recommendedBooks = Object.values(domainAnalysis)
            .flatMap(a => a.missingBooks)
            .sort(() => 0.5 - Math.random()) // Shuffle for variety
            .slice(0, 5); // Take top 5

        return {
            totalOwned: myBooks.length,
            domainAnalysis,
            recommendedBooks
        };
    }

    private createEmptyAnalysis(domain: GrowthDomain): DomainAnalysis {
        return {
            domain,
            totalCore: 0,
            ownedCore: 0,
            percentage: 0,
            missingBooks: []
        };
    }
}

export const libraryAnalysisService = new LibraryAnalysisService();
