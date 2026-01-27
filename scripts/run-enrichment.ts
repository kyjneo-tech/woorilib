
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AutoTagger } from '../src/features/curation/engine/analyzers/auto-tagger';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function enrichData() {
  console.log('✨ Starting Data Enrichment (Standardization)...');

  // 1. Enrich Collections
  const { data: collections } = await supabase.from('collections').select('*');
  if (collections) {
    console.log(`📚 Processing ${collections.length} Collections...`);
    
    for (const item of collections) {
      const fullText = `${item.title} ${item.publisher} ${item.summary || ''}`;
      const result = AutoTagger.analyze(fullText);
      
      // Update DB
      const { error } = await supabase.from('collections').update({
        category: result.primaryCategory,
        // We could also merge tags into features or a new column, but category is key
      }).eq('id', item.id);

      if (!error) {
        process.stdout.write('.');
      } else {
        console.error(`❌ Failed: ${item.title}`, error.message);
      }
    }
  }

  console.log('\n');

  // 2. Enrich Verified Books
  const { data: books } = await supabase.from('verified_books').select('*');
  if (books) {
    console.log(`📖 Processing ${books.length} Books...`);

    for (const book of books) {
      const fullText = `${book.title} ${book.description || ''}`;
      const result = AutoTagger.analyze(fullText);

      // Merge existing tags with new taxonomy tags
      const existingTags = book.tags || [];
      const newTags = [...new Set([...existingTags, ...result.tags, result.primaryCategory])];

      const { error } = await supabase.from('verified_books').update({
        tags: newTags,
        // We can also infer age ranges here if we add AgeAnalyzer later
      }).eq('id', book.id);

       if (!error) {
        process.stdout.write('+');
      }
    }
  }

  console.log('\n✅ Enrichment Completed!');
}

enrichData();
