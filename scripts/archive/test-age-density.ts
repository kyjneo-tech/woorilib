
import dotenv from 'dotenv';
import path from 'path';
import { NaverCollector } from '../src/features/curation/collectors/naver-collector';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAgeDensity() {
    console.log('🧪 Testing "Age Density Signature" for Library Curation...\n');

    const testBooks = [
        { name: '수박 수영장', type: '그림책' },
        { name: '흔한남매', type: '학습만화' },
        { name: '두근두근 1학년', type: '7세추천' },
        { name: '달님 안녕', type: '0-2세' }
    ];

    const ageSegments = [
        { label: '0-2세 (돌아기)', query: ' "돌아기"' },
        { label: '3-4세 (4세)', query: ' "4세"' },
        { label: '7세+ (초등)', query: ' "초등"' }
    ];

    for (const book of testBooks) {
        console.log(`📘 [${book.name}] (${book.type})`);
        
        // 1. Total Buzz
        const totalBuzz = await NaverCollector.getBlogReviewCount(`"${book.name}"`);
        console.log(`   Total Buzz: ${totalBuzz.toLocaleString()}`);

        for (const segment of ageSegments) {
            const query = `"${book.name}"${segment.query}`;
            const count = await NaverCollector.getBlogReviewCount(query);
            const ratio = totalBuzz > 0 ? (count / totalBuzz) * 100 : 0;
            
            console.log(`   🔸 ${segment.label} Density: ${ratio.toFixed(2)}% (${count.toLocaleString()} hits)`);
        }
        console.log('-----------------------------------');
        await new Promise(r => setTimeout(r, 200));
    }
}

testAgeDensity();
