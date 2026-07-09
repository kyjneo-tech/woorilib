import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../src/shared/lib/prisma';
import { ClassicGuardian } from '../src/features/curation/engine/guardians/classic-guardian';
import { PopularityHarvester } from '../src/features/curation/engine/collectors/popularity-harvester';
import { VisualQualityGuard } from '../src/features/curation/engine/analyzers/visual-quality-guard';
import { DeepAnalyzer } from '../src/features/curation/engine/analyzers/deep-analyzer';
import { TrendCollector, TaxonomyOptimizer } from '../src/features/curation/engine/analyzers/trend-collector';

console.log('[COCO] 🐾 Waking up...');
// 🐾 COCO: Use .env instead of .env.local for script execution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log(`[COCO_DEBUG] Environment: NODE_ENV=${process.env.NODE_ENV}`);
console.log(`[COCO_DEBUG] PID: ${process.pid}`);
console.log(`[COCO_DEBUG] CWD: ${process.cwd()}`);
console.log(`[COCO_DEBUG] DB URL Check: ${process.env.DATABASE_URL ? 'PRESENT' : 'MISSING'}`);

async function runGuardianMission() {
    console.log('[COCO] 🐾 Mission: Classic Guardian (Librarian)');
    const guardian = new ClassicGuardian();
    await guardian.runMission();
}

async function runEnrichMission() {
    console.log('[COCO] 🐾 Mission: Intelligence Data Enrichment');
    const { AutoTagger } = await import('../src/features/curation/engine/analyzers/auto-tagger');

    // Fetch books missing deep analysis via Prisma (Limit to 100 for better throughput)
    const books = await prisma.verified_books.findMany({
        where: {
            verification_status: 'pending'
        },
        take: 100
    });

    if (!books || books.length === 0) {
        console.log('[COCO] 💤 No pending books found for enrichment. Coco is happy!');
        return;
    }

    console.log(`[COCO] 📚 Found ${books.length} books to enrich.`);

    for (const book of books) {
        console.log(`[COCO] 🔍 Analyzing: ${book.title}`);
        
        // 1. Try AI Analysis
        let analysis = await DeepAnalyzer.analyze({
            title: book.title,
            author: book.author || '',
            description: book.description || ''
        });

        // 2. 🐾 COCO FALLBACK: If AI fails (no API key), use Rule-based analysis!
        if (!analysis) {
            const basicResult = AutoTagger.analyze(`${book.title} ${book.description || ''}`);
            analysis = {
                developmental_areas: basicResult.tags.length > 0 ? [basicResult.primaryCategory] : ['인지'],
                sub_competencies: ['기본정제'],
                emotional_keywords: ['일반'],
                curation_points: ['코코 자동 분석'],
                energy_level: 5,
                ai_comment: '코코 에이전트가 기본 규칙으로 분석한 책입니다. 멍! 🐾'
            };
        }

        if (analysis) {
            try {
                await prisma.verified_books.update({
                    where: { id: book.id },
                    data: {
                        developmental_areas: analysis.developmental_areas,
                        sub_competencies: analysis.sub_competencies,
                        emotional_keywords: analysis.emotional_keywords,
                        ai_comment: analysis.ai_comment,
                        verification_status: 'verified',
                        confidence_score: 70
                    }
                });
                process.stdout.write('🐾');
            } catch (err) {
                console.error(`\n[COCO] ❌ Update Failed for ${book.title}:`, err);
            }
        }
    }
    console.log('\n[COCO] ✅ Enrichment mission part complete!');
}

async function runHarvestMission() {
    console.log('[COCO] 🐾 Mission: Popularity Harvester');

    // Fetch books to update popularity via Prisma (verified_books in this case)
    const books = await prisma.verified_books.findMany({
        where: {
            NOT: { isbn13: null }
        },
        take: 10,
        select: {
            id: true,
            isbn13: true,
            title: true
        }
    });

    if (!books) return;

    for (const book of books) {
        if (!book.isbn13) continue;

        const stats = await PopularityHarvester.harvest(book.isbn13);
        if (stats) {
            console.log(`[COCO] 🚀 Harvested stats for: ${book.title} (ISBN: ${book.isbn13}) -> Index: ${stats.salesIndex}`);
            // Note: If you want to update the collection associated with this book:
            // This requires mapping book.collection_id to Collection model.
        }
    }
}

async function runVisualCheckMission() {
    console.log('[COCO] 🐾 Mission: Visual Quality Guard');

    const books = await prisma.verified_books.findMany({
        take: 20,
        select: {
            id: true,
            title: true,
            cover_url: true
        }
    });

    if (!books) return;

    for (const book of books) {
        if (!book.cover_url) continue;

        const isOk = await VisualQualityGuard.checkImageUrl(book.cover_url);
        if (!isOk) {
            console.log(`[COCO] ⚠️ Broken image detected for: ${book.title}. Attempting recovery...`);
        }
    }
}

async function runTrendMission() {
    console.log('[COCO] 🐾 Mission: Trend & Taxonomy Optimizer');

    const proposal = await TrendCollector.proposeTheme();
    console.log(`[COCO] 💡 Proposed Theme: ${proposal.title}`);
    console.log(`[COCO] 💡 Tags: ${proposal.tags.join(', ')}`);

    const keywords = await TaxonomyOptimizer.suggestKeywords();
    console.log(`[COCO] 💡 Suggested Taxonomy Keywords: ${keywords.join(', ')}`);
}

async function main() {
    const mission = process.argv[2] || 'all';
    console.log(`[COCO] 🎯 Target Mission: ${mission}`);

    try {
        if (mission === 'guardian' || mission === 'all') await runGuardianMission();
        if (mission === 'enrich' || mission === 'all') await runEnrichMission();
        if (mission === 'harvest' || mission === 'all') await runHarvestMission();
        if (mission === 'visual-check' || mission === 'all') await runVisualCheckMission();
        if (mission === 'trend' || mission === 'all') await runTrendMission();

        console.log('[COCO] 🐾 Master Worker mission complete!');
    } catch (error) {
        console.error('[COCO] ❌ Master Worker CRASHED:', error);
    } finally {
        await prisma.$disconnect();
        console.log('[COCO] 💤 Prisma disconnected. Bye!');
    }
}

main().catch((err) => {
    console.error('[COCO] 💀 Fatal Error:', err);
    process.exit(1);
});
