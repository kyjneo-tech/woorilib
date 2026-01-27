
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AladinCollector } from '../src/features/curation/collectors/aladin-collector';
import { HardwareDetector } from '../src/features/curation/engine/analyzers/hardware-detector';
import { TARGET_PUBLISHERS } from '../src/features/curation/lib/target-keywords';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility: Sleep to respect API Rate Limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function seedMassive() {
  console.log('🚀 Starting Massive Data Collection...');
  console.log(`🎯 Targets: ${TARGET_PUBLISHERS.length} Publishers`);

  let totalProcessed = 0;
  let totalAdded = 0;

  for (const group of TARGET_PUBLISHERS) {
    console.log(`\n📚 Processing Publisher: ${group.name}`);
    
    for (const keyword of group.keywords) {
      console.log(`   🔎 Searching: ${keyword}...`);
      
      // 1. Primary Search: Publisher + Keyword
      let results = await AladinCollector.search(`${group.name} ${keyword}`, 3); 
      await sleep(500);

      // 2. Fallback Search: Keyword Only (if Primary failed)
      // Why? Publisher name might differ in API (e.g. "Rainbow" vs "KIPS", "Great Books" vs "GreatBooks")
      if (results.length === 0) {
        console.log(`      ⚠️ First attempt failed. Retrying with keyword only: "${keyword}"`);
        results = await AladinCollector.search(keyword, 3);
        await sleep(500);
      }

      if (results.length === 0) {
        console.log(`      ❌ Still no results for ${keyword}`);
        continue;
      }

      // Pick the best match (usually the first one, but could be multiple volumes)
      // For Jeonjib, we usually grab the 'SET' or the main volume.
      const bestMatch = results[0];
      
      // Analyze Features (Hardware, etc) from Title + Description
      const fullText = `${bestMatch.title} ${bestMatch.description}`;
      const features = HardwareDetector.detect(fullText);

      // Log detected features if any
      const featureKeys = Object.entries(features).filter(([_, v]) => v).map(([k]) => k);
      if (featureKeys.length > 0) {
        console.log(`      💡 Detected Features: ${featureKeys.join(', ')}`);
      }

      // Upsert Collection
      const { data: collection, error } = await supabase
        .from('collections')
        .upsert({
          title: keyword, // Using the keyword as the canonical title for now, or use bestMatch.title
          publisher: group.name,
          category: bestMatch.categoryName.split('>')[1] || 'Uncategorized', // Extraction needed
          summary: bestMatch.description.substring(0, 300),
          features: features,
          updated_at: new Date()
        }, { onConflict: 'publisher, title' })
        .select()
        .single();

      if (error) {
        console.error(`      ❌ Error saving collection: ${error.message}`);
        continue;
      }

      // Link Verified Book (The Representative Item)
      await supabase.from('verified_books').upsert({
        isbn13: bestMatch.isbn13,
        title: bestMatch.title,
        type: 'collection_item',
        collection_id: collection.id,
        is_verified: true,
        source: 'aladin',
        cover_url: bestMatch.cover,
        price_standard: bestMatch.priceStandard,
        tags: featureKeys, // Add hardware features as tags
        description: bestMatch.description
      }, { onConflict: 'isbn13' });

      totalAdded++;
      process.stdout.write('.'); // Progress indicator
    }
    totalProcessed++;
  }

  console.log('\n\n✨ [New Arrivals Scanner]');
  const newBooks = await AladinCollector.getNewArrivals(10);
  console.log(`   Found ${newBooks.length} new arrivals.`);
  
  for (const book of newBooks) {
     // Save as Single Book candidates (Type: single)
     // This part is for 'verified_books' without a collection parent mostly
     // unless we identify it as a collection.
     const features = HardwareDetector.detect(`${book.title} ${book.description}`);
     
     await supabase.from('verified_books').upsert({
        isbn13: book.isbn13,
        title: book.title,
        type: 'single',
        publisher: book.publisher,
        author: book.author,
        pub_date: book.pubDate, // API returns string, Postgres might need cast? Aladin Date format check needed
        is_verified: true,
        source: 'aladin',
        cover_url: book.cover,
        description: book.description,
        tags: Object.entries(features).filter(([_, v]) => v).map(([k]) => k)
      }, { onConflict: 'isbn13' });
      process.stdout.write('+');
  }

  console.log(`\n\n🎉 Massive Seed Completed! Added/Updated ${totalAdded} Collections.`);
}

seedMassive();
