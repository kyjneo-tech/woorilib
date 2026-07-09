
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.LIBRARY_API_KEY;
const BASE_URL = 'http://data4library.kr/api';

async function testNaruReality() {
    console.log('🧐 Testing Naru API Reality (Age-based Generic Book Check)\n');

    if (!API_KEY) {
        console.error('❌ Missing LIBRARY_API_KEY in .env.local');
        return;
    }

    // Age Codes: 0 (0-5y), 6 (6-7y), 8 (8-13y)
    const ageGroups = [
        { code: '0', label: '0-5세 (Y 영유아)' },
        { code: '6', label: '6-7세 (유아)' },
        { code: '8', label: '8-13세 (초등)' }
    ];

    for (const age of ageGroups) {
        console.log(`--- [ ${age.label} ] 인기 대출 도서 TOP 15 ---`);
        try {
            // Testing 2024 full year popularity
            const res = await fetch(`${BASE_URL}/loanItemSrch?format=json&authKey=${API_KEY}&startDt=2024-01-01&endDt=2024-12-31&age=${age.code}&pageSize=15`);
            const data = await res.json();
            
            const docs = data.response.docs || [];
            docs.forEach((d: any, i: number) => {
                const b = d.doc;
                console.log(`${i+1}. [${b.class_no}] ${b.bookname} (${b.publisher}) / 대출: ${b.loan_count}`);
            });
            
            if (docs.length === 0) console.log('데이터 없음');
        } catch (e) {
            console.error(`Fail for age ${age.code}`, e);
        }
        console.log('');
        await new Promise(r => setTimeout(r, 200));
    }

    // Filter Test: KDC 800 (Literature) usually filtered out comics in some libraries.
    // However, some comics are categorized under 800 (Graphic Novels).
    console.log('--- [ 필터 테스트 ] 0-5세 + 문학(KDC 800) 필터링 결과 ---');
    try {
        const res = await fetch(`${BASE_URL}/loanItemSrch?format=json&authKey=${API_KEY}&startDt=2024-01-01&endDt=2024-12-31&age=0&kdc=8&pageSize=5`);
        const data = await res.json();
        const docs = data.response.docs || [];
        docs.forEach((d: any, i: number) => {
            console.log(`${i+1}. [${d.doc.class_no}] ${d.doc.bookname} (${d.doc.publisher})`);
        });
    } catch (e) { }

    console.log('\n✨ Reality check complete.');
}

testNaruReality();
