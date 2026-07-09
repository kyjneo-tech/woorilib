
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AladinCollector } from '../src/features/curation/collectors/aladin-collector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Supabase (Admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initial Seed Data: Famous Jeonjibs (Example Top 3)
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
  }
];

async function seed() {
  console.log('🌱 Starting Curation Seed...');

  for (const item of SEED_COLLECTIONS) {
    console.log(`\nProcessing: ${item.title} (${item.publisher})`);

    // 1. Search in Aladin to Validate & Get Image
    const searchResults = await AladinCollector.search(`${item.publisher} ${item.title}`, 1);

    let coverUrl = '';
    let description = '';
    let validated = false;

    if (searchResults && searchResults.length > 0) {
      console.log(`✅ Found in Aladin: ${searchResults[0].title}`);
      coverUrl = searchResults[0].cover;
      description = searchResults[0].description;
      validated = true;
    } else {
      console.warn(`⚠️ Not found in Aladin: ${item.title}`);
    }

    // 2. Insert into Collections Table
    const { data: collection, error } = await supabase
      .from('collections')
      .upsert({
        title: item.title,
        publisher: item.publisher,
        target_age_months_start: Math.min(...item.ages) * 12,
        target_age_months_end: Math.max(...item.ages) * 12 + 11,
        total_count: 50, // Approximation or fetch from description analysis
        category: item.category,
        summary: validated ? description.substring(0, 200) + '...' : 'Data pending...',
        cover_url: coverUrl, // Add cover_url
        features: { saypen: true }, // Default assumption for major brands, needs AI refinement
      }, { onConflict: 'publisher, title' }) // Match the unique constraint
      .select()
      .single();

    if (error) {
      console.error('❌ DB Insert Error:', error.message);
      continue;
    }

    console.log(`✨ Upserted Collection ID: ${collection.id}`);

    // 3. (Optional) Create a dummy verified_book for the representative item
    if (searchResults[0]) {
      await supabase.from('verified_books').upsert({
        isbn13: searchResults[0].isbn13,
        title: searchResults[0].title,
        type: 'collection_item', // Using representative item for now
        collection_id: collection.id,
        target_ages: item.ages,
        is_verified: true,
        source: 'aladin',
        cover_url: coverUrl
      }, { onConflict: 'isbn13' });
      console.log(`   Linked verified book: ${searchResults[0].title}`);
    }
  }

  console.log('\n✅ Seed Completed!');
}

seed();
