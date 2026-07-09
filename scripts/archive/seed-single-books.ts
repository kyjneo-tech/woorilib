
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { SingleBookCollector } from '../src/features/curation/engine/collectors/single-book-collector';
import { HardwareDetector } from '../src/features/curation/engine/analyzers/hardware-detector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Target Authors for "Steady Seller" Collection
const TARGET_AUTHORS = [
  '앤서니 브라운', '백희나', '최숙희', '에릭 칼', '요시타케 신스케', 
  '존 버닝햄', '이수지', '안녕달'
];

async function seedSingleBooks() {
  console.log('🚀 Starting Single Book Collection...');

  // 1. Fetch Steady Sellers (Category Based)
  const steadySellers = await SingleBookCollector.getSteadySellers(20);
  console.log(`\n📦 Category Bestsellers: ${steadySellers.length} items`);

  // 2. Fetch Author Based Picks
  const authorPicks = await SingleBookCollector.getByAuthors(TARGET_AUTHORS);
  console.log(`\n✍️  Author Picks: ${authorPicks.length} items`);

  const allBooks = [...steadySellers, ...authorPicks];

  console.log(`\n💾 Upserting ${allBooks.length} books to DB...`);

  let added = 0;
  for (const book of allBooks) {
    // Detect Features
    const features = HardwareDetector.detect(`${book.title} ${book.description}`);
    const featureTags = Object.entries(features).filter(([_, v]) => v).map(([k]) => k);

    // Upsert to verified_books
    const { error } = await supabase.from('verified_books').upsert({
      isbn13: book.isbn13,
      title: book.title,
      type: 'single', // Explicitly marking as single book
      publisher: book.publisher,
      author: book.author,
      pub_date: book.pubDate,
      cover_url: book.cover,
      description: book.description,
      price_standard: book.priceStandard,
      tags: featureTags,
      is_verified: true,
      source: 'aladin'
    }, { onConflict: 'isbn13' });

    if (error) {
      console.error(`   ❌ Failed: ${book.title}`, error.message);
    } else {
      process.stdout.write('.');
      added++;
    }
  }

  console.log(`\n\n✅ Single Book Seed Completed! Added ${added} books.`);
}

seedSingleBooks();
