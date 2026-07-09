
import dotenv from 'dotenv';
import path from 'path';
import { NaverCollector } from '../src/features/curation/collectors/naver-collector';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

async function testRatioLogic() {
  console.log('🧪 Testing "Co-occurrence Ratio" Logic...\n');

  const testCases = [
    { title: '베베코알라', pen: '세이펜', expected: 'HIGH' },
    { title: '베베코알라', pen: '바나펜', expected: 'LOW' }, // 27 hits previously (Noise)
    { title: '라라랜드', pen: '세이펜', expected: 'HIGH' },
    { title: '라라랜드', pen: '바나펜', expected: 'LOW' }, // 12 hits (Noise)
    { title: '자연이 소곤소곤', pen: '세이펜', expected: 'HIGH' },
  ];

  for (const test of testCases) {
    // 1. Base Volume (Book only)
    const baseCount = await NaverCollector.getBlogReviewCount(`"${test.title}"`);
    
    // 2. Co-occurrence Volume (Book + Pen)
    const coCount = await NaverCollector.getBlogReviewCount(`"${test.title}" "${test.pen}"`);
    
    // 3. Ratio
    const ratio = baseCount > 0 ? (coCount / baseCount) * 100 : 0;
    
    console.log(`📘 [${test.title}] w/ ${test.pen}`);
    console.log(`   Base: ${baseCount.toLocaleString()} | Co: ${coCount.toLocaleString()}`);
    console.log(`   Ratio: ${ratio.toFixed(2)}%`);
    console.log(`   Verdict: ${ratio > 0.5 ? '✅ PASS' : '❌ NOISE'} (Threshold: 0.5%)`);
    console.log('-----------------------------------');
    
    await new Promise(r => setTimeout(r, 200));
  }
}

testRatioLogic();
