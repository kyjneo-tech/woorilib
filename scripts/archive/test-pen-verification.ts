
import dotenv from 'dotenv';
import path from 'path';
import { NaverCollector } from '../src/features/curation/collectors/naver-collector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

async function verifyPenHypothesis() {
  console.log('🔍 Testing "Search Volume" Hypothesis for Pen Compatibility...\n');
  
  const testCases = [
    { book: '베베코알라', pen: '세이펜', expected: true },
    { book: '베베코알라', pen: '바나펜', expected: false },
    { book: '베베코알라', pen: '뽀로로펜', expected: false },
    
    { book: '아람 자연이랑', pen: '세이펜', expected: true },
    { book: '아람 자연이랑', pen: '바나펜', expected: false }, // 아람 책이지만 바나펜 안될수도? (확인필요)
    
    { book: '추피의 생활이야기', pen: '세이펜', expected: true }, // 스티커 작업 많이 함 (Buzz 높을 것)
    { book: '추피의 생활이야기', pen: '레인보우펜', expected: true }, // 전용펜

    { book: '뽀로로 생활동화', pen: '뽀로로펜', expected: true },
    { book: '뽀로로 생활동화', pen: '세이펜', expected: true },
    
    // Suspicious Cases (User Pointed Out)
    { book: '내 친구 수학공룡', pen: '뽀로로펜', expected: false }, // GreatBooks uses Saypen usually
    { book: '그레이트북스 라라랜드', pen: '피쉬톡', expected: false }, // GreatBooks vs BlueRabbit Pen?
    { book: '베니의 세계책방', pen: '토키북', expected: false }, // Should be low
  ];

  for (const test of testCases) {
    // 1. Strict Query (with Quotes)
    const strictQuery = `"${test.book}" "${test.pen}"`; 
    
    // We can't easily fetch snippet with getBlogReviewCount (it only returns count).
    // Let's use NaverCollector.search to get items and check title/description.
    // We need to expose a method for blog search items, not just count.
    // For now, let's just check the count with strict quotes.
    
    const count = await NaverCollector.getBlogReviewCount(strictQuery);
    
    console.log(`Query: [${strictQuery.padEnd(30)}] -> Count: ${count.toLocaleString().padStart(7)} | Expected: ${test.expected ? 'HIGH' : 'LOW'}`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
}

verifyPenHypothesis();
