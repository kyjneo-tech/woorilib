
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AladinCollector } from '../src/features/curation/collectors/aladin-collector';
import { NaverCollector } from '../src/features/curation/collectors/naver-collector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Prisma
const prisma = new PrismaClient();

async function runRankingUpdate() {
  console.log('🚀 Starting Ranking Engine Update...');
  
  // 1. Fetch all collections
  const collections = await prisma.collection.findMany();
  console.log(`📚 Found ${collections.length} collections.`);

  let successCount = 0;

  for (const col of collections) {
    console.log(`\n-----------------------------------`);
    console.log(`🔍 Processing: ${col.title} (${col.publisher})`);

    try {
        // A. Aladin SalesPoint
        // Try searching for the exact title + publisher for best match
        let aladinResults = await AladinCollector.search(`${col.title} ${col.publisher}`);
        if (!aladinResults || aladinResults.length === 0) {
             // Fallback: Title only
             aladinResults = await AladinCollector.search(col.title);
        }

        const aladinBest = aladinResults?.[0];
        const salesIndex = aladinBest?.salesPoint || 0;
        
        // B. Naver Blog Count
        // Query: "Title Publisher 후기" or just "Title 후기" if strong brand
        const blogQuery = `${col.title} ${col.publisher}`;
        const blogReviewCount = await NaverCollector.getBlogReviewCount(blogQuery);

        console.log(`   > Aladin SalesIndex: ${salesIndex.toLocaleString()}`);
        console.log(`   > Naver BlogReviews: ${blogReviewCount.toLocaleString()}`);

        // C. Update DB
        await prisma.collection.update({
            where: { id: col.id },
            data: {
                salesIndex,
                blogReviewCount,
                rankingUpdatedAt: new Date()
            }
        });
        
        successCount++;
        // Rate limiting (respect APIs)
        await new Promise(r => setTimeout(r, 500)); 

    } catch (e) {
        console.error(`❌ Failed to update ${col.title}:`, e);
    }
  }

  console.log(`\n✨ Ranking Update Completed! (${successCount}/${collections.length})`);
  await prisma.$disconnect();
}

runRankingUpdate();
