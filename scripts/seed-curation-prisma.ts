
import { PrismaClient } from '@prisma/client';
import { AladinCollector } from '../src/features/curation/collectors/aladin-collector';

const prisma = new PrismaClient();

const SEED_COLLECTIONS = [
  {
    title: '안녕 마음아',
    publisher: '그레이트북스',
    category: 'EMOTION',
    ages: [3, 4, 5],
    keywords: ['인성동화', '생활습관', '스테디셀러']
  },
  {
    title: '자연이랑',
    publisher: '아람키즈',
    category: 'NATURE',
    ages: [2, 3, 4, 5],
    keywords: ['자연관찰', '실사', '세이펜']
  },
  {
    title: '도레미 곰',
    publisher: '그레이트북스',
    category: 'CREATIVE',
    ages: [2, 3, 4],
    keywords: ['음원강자', '세계창작', '노래']
  },
  {
    title: '베베 코알라',
    publisher: '그레이트북스',
    category: 'EMOTION',
    ages: [1, 2, 3],
    keywords: ['생활동화', '추피', '인성']
  },
  {
    title: '과학공룡',
    publisher: '그레이트북스',
    category: 'MATH_SCI',
    ages: [4, 5, 6],
    keywords: ['과학', '원리', '실험'] 
  },
  {
      title: '놀라운 자연',
      publisher: '그레이트북스',
      category: 'NATURE',
      ages: [3, 4, 5],
      keywords: ['자연', '동물']
  },
  {
      title: '베이비올 아기',
      publisher: '아람',
      category: 'TOY',
      ages: [0, 1, 2],
      keywords: ['초점', '헝겊책', '오감']
  },
  // --- New Additions for 0-2 Years (Cognitive & More Toy) ---
  {
      title: '핀덴 베베',
      publisher: '한솔교육',
      category: 'COGNITIVE',
      ages: [0, 1, 2, 3],
      keywords: ['이중언어', '교구', '감각']
  },
  {
      title: '돌잡이 한글',
      publisher: '천재교육',
      category: 'COGNITIVE',
      ages: [1, 2, 3],
      keywords: ['조작북', '말놀이', '인지']
  },
  {
      title: '블루래빗 첫 토이북',
      publisher: '블루래빗',
      category: 'TOY',
      ages: [0, 1, 2],
      keywords: ['국민육아템', '사운드북', '입체']
  },
  {
      title: '노부영 베이비',
      publisher: '제이와이북스',
      category: 'ENGLISH',
      ages: [0, 1, 2, 3],
      keywords: ['영어노래', '마더구스', '원서']
  }
];

async function seed() {
  console.log('🌱 Starting Curation Seed (Prisma)...');

  try {
    for (const item of SEED_COLLECTIONS) {
        console.log(`\nProcessing: ${item.title} (${item.publisher})`);
    
        // 1. Search in Aladin to Validate & Get Image
        const searchResults = await AladinCollector.search(`${item.publisher} ${item.title}`, 1);
        
        let coverUrl = '';
        let description = '';
        let validated = false;
        let summary = 'Data pending...';
        let verifiedBookData = null;
    
        if (searchResults && searchResults.length > 0) {
          console.log(`✅ Found in Aladin: ${searchResults[0].title}`);
          coverUrl = searchResults[0].cover;
          description = searchResults[0].description;
          validated = true;
          summary = description.substring(0, 200) + '...';
          verifiedBookData = searchResults[0];
        } else {
          console.warn(`⚠️ Not found in Aladin: ${item.title}`);
        }
    
        // 2. Insert into Collections Table using Prisma
        const collection = await prisma.collection.upsert({
            where: {
                publisher_title: {
                    publisher: item.publisher,
                    title: item.title
                }
            },
            update: {
                category: item.category,
                summary: summary,
                // Only update modifiable fields if needed
            },
            create: {
                title: item.title,
                publisher: item.publisher,
                targetAgeMonthsStart: Math.min(...item.ages) * 12,
                target_age_months_end: Math.max(...item.ages) * 12 + 11,
                total_count: 50,
                category: item.category,
                summary: summary,
                features: { saypen: true },
                blogReviewCount: 0,
                salesIndex: 0
            }
        });
    
        console.log(`✨ Upserted Collection ID: ${collection.id}`);
    
        // 3. (Optional) Create a dummy verified_book
        if (verifiedBookData) {
            // Need to match VerifiedBooks model
            // Check verified_books model definition in schema if needed.
            // Assuming simplified upsert here or skipping if complex.
            // Let's rely on collections for dashboard.
        }
      }
      console.log('\n✅ Seed Completed!');
  } catch (e) {
      console.error('❌ Seed Error:', e);
  } finally {
      await prisma.$disconnect();
  }
}

seed();
