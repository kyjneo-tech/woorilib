
import dotenv from 'dotenv';
import path from 'path';
import { ShelfComposer } from '../src/features/curation/engine/display/shelf-composer';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

async function testDisplayEngine() {
  const testAges = [12, 36, 60];

  for (const age of testAges) {
    console.log(`\n\n🧪 Testing Display Engine for Age: ${age} Months`);
    console.log('='.repeat(50));

    const result = await ShelfComposer.compose(age);

    console.log(`[Stage]: ${result.stage.label} (${result.stage.stage})`);
    console.log(`[Desc]: ${result.stage.description}`);
    console.log(`[Shelves]: ${result.shelves.length} Shelves Generated`);

    for (const shelf of result.shelves) {
      console.log(`\n  📂 Shelf: ${shelf.title} (${shelf.category})`);
      
      if (shelf.items.length === 0) {
        console.log('     (Empty Shelf)');
        continue;
      }

      for (const item of shelf.items) {
        console.log(`     🔹 [Main] ${item.collection.publisher} <${item.collection.title}>`);
        if (item.singles.length > 0) {
          console.log(`        └── 🔗 Matched Singles: ${item.singles.length} items`);
          item.singles.forEach(s => console.log(`            - ${s.title.substring(0, 30)}...`));
        } else {
            console.log(`        └── (No Singles Matched)`);
        }
      }
    }
  }
}

testDisplayEngine();
