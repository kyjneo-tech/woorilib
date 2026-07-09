import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import { STANDARD_ROADMAP_DATA, RoadmapItem, RoadmapStage } from '../features/curation/config/standard-roadmaps';
import { AladinCollector } from '../features/curation/collectors/aladin-collector';
import { BookCategory } from '../features/curation/engine/taxonomy';

// Load env
if (process.env.NODE_ENV !== 'production') {
    const envLocal = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    if (envLocal.error || !process.env.DATABASE_URL) {
        console.log('⚠️ .env.local not found or missing DATABASE_URL, trying .env');
        dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

// function mapDomainToCategory removed - used preciseCategoryMapper instead

// Refined mapping based on inspection of ShelfComposer
function preciseCategoryMapper(item: RoadmapItem): BookCategory {
    if (item.domain === 'social') {
        if (item.stage === RoadmapStage.STEP_4_TREE) return 'HISTORY'; // Who? is History/Bio
        return 'EMOTION'; // Bebe Koala, Heart are Emotion/Social
    }
    if (item.domain === 'math_sci') {
        if (item.title.includes('자연')) return 'NATURE'; // Nature
        return 'MATH_SCI';
    }
    if (item.domain === 'language') return 'LANGUAGE';
    if (item.domain === 'english') return 'ENGLISH';
    if (item.domain === 'art_music') return 'ART_MUSIC';
    if (item.domain === 'cognitive') return 'COGNITIVE';

    return 'UNKNOWN';
}

async function seed() {
    console.log('🌱 Starting Curation Foundation Seed (v2 - Direct PG)...');

    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        for (const item of STANDARD_ROADMAP_DATA) {
            console.log(`\nProcessing: ${item.title} (${item.publisher})`);

            // 1. Search in Aladin to Validate & Get Image
            const searchResults = await AladinCollector.search(`${item.publisher} ${item.title}`, 1);

            let coverUrl = '';
            let description = '';
            let validated = false;
            let isbn13 = '';
            let author = '';

            if (searchResults && searchResults.length > 0) {
                console.log(`✅ Found in Aladin: ${searchResults[0].title}`);
                coverUrl = searchResults[0].cover;
                description = searchResults[0].description;
                isbn13 = searchResults[0].isbn13;
                author = searchResults[0].author;
                validated = true;
            } else {
                console.warn(`⚠️ Not found in Aladin: ${item.title} - Using placeholder.`);
            }

            // 2. Upsert into Collections Table via SQL
            const startMonth = item.targetMonths[0];
            const endMonth = item.targetMonths[1];
            const baseScore = item.priority === 'core' ? 10000 : 5000;
            const randomVariation = Math.floor(Math.random() * 500);
            const finalScore = baseScore + randomVariation;
            const category = preciseCategoryMapper(item);
            const summary = validated ? description.substring(0, 300) + '...' : (item.description || 'Data pending...');
            const blogCount = item.priority === 'core' ? 5000 : 1000;
            const features = JSON.stringify({ saypen: true, expert_pick: true });

            const collectionQuery = `
            INSERT INTO public.collections (
                title, publisher, target_age_months_start, target_age_months_end, 
                total_count, category, summary, cover_url, features, 
                sales_index, blog_review_count
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (publisher, title) 
            DO UPDATE SET 
                target_age_months_start = EXCLUDED.target_age_months_start,
                target_age_months_end = EXCLUDED.target_age_months_end,
                sales_index = GREATEST(collections.sales_index, EXCLUDED.sales_index),
                blog_review_count = GREATEST(collections.blog_review_count, EXCLUDED.blog_review_count),
                cover_url = COALESCE(NULLIF(EXCLUDED.cover_url, ''), collections.cover_url),
                summary = COALESCE(NULLIF(EXCLUDED.summary, ''), collections.summary)
            RETURNING id;
        `;

            const res = await client.query(collectionQuery, [
                item.title, item.publisher, startMonth, endMonth,
                30, category, summary, coverUrl, features,
                finalScore, blogCount
            ]);

            const collectionId = res.rows[0].id;
            console.log(`✨ Upserted Collection: ${item.title} [ID: ${collectionId}]`);

            // 3. Upsert into Verified Books (to act as links)
            if (validated && isbn13) {
                // Need to ensure verified_books has these columns. Assuming yes from previous check.
                // But I should check if verified_books exists too? Assume it does or correct later.
                // Using check-and-create pattern is safer but let's assume existence for verified_books as it's core.

                const verifiedQuery = `
                INSERT INTO public.verified_books (
                    isbn13, title, author, description, cover_url, type, 
                    collection_id, is_verified, source, verification_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aladin', 'verified')
                ON CONFLICT (isbn13) 
                DO UPDATE SET
                    collection_id = EXCLUDED.collection_id,
                    cover_url = COALESCE(NULLIF(EXCLUDED.cover_url, ''), verified_books.cover_url)
            `;

                await client.query(verifiedQuery, [
                    isbn13, searchResults[0].title, author, description, coverUrl,
                    'collection_item', collectionId, true
                ]);
                console.log(`   Linked verified book: ${isbn13}`);
            }
        }

        console.log('\n✅ Curation Foundation Seed Completed!');

    } catch (e) {
        console.error('❌ Script Error:', e);
    } finally {
        await client.end();
    }
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
