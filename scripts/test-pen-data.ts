
import dotenv from 'dotenv';
import path from 'path';
import { AladinCollector } from '../src/features/curation/collectors/aladin-collector';
import { PenDetector } from '../src/features/curation/engine/analyzers/pen-detector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

async function testPenData() {
  console.log('🔍 Testing Aladin API for Pen Data...');
  
  // Test Cases: Compatible books
  const targets = [
    '베베코알라', // 세이펜
    '아람 자연이랑', // 세이펜/바나펜?
    '블루래빗 오감발달', 
    '추피의 생활이야기', // 레인보우펜
    '뽀로로 펜'
  ];

  for (const query of targets) {
    console.log(`\n---------------------------------`);
    console.log(`Checking: ${query}`);
    
    const results = await AladinCollector.search(query, 1);
    const book = results?.[0];

    if (book) {
        console.log(`Title: ${book.title}`);
        console.log(`Desc Length: ${book.description?.length}`);
        console.log(`Desc Preview: ${book.description?.substring(0, 100)}...`);
        
        // Analyze
        const fullText = `${book.title} ${book.description}`;
        const pens = PenDetector.analyze(fullText);
        console.log(`Detected Pens:`, PenDetector.getBadgeList(pens));
    } else {
        console.log('No results found.');
    }
  }
}

testPenData();
