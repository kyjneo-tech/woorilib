import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ALADIN_API_KEY = process.env.ALADIN_TTB_KEY;
if (!ALADIN_API_KEY) {
  console.error('❌ ALADIN_TTB_KEY is missing in environment variables.');
  process.exit(1);
}

async function searchSeries(keyword: string, page: number = 1) {
  const url = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(keyword)}&QueryType=Title&MaxResults=50&start=${page}&SearchTarget=Book&Output=js&Version=20131101`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.item || [];
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('[COCO] 🐾 [Project 10K] Phase 3: MASSIVE CATEGORY EXPANSION!');
  
  const categories = {
    'MajorPublishers': [
      '천재교육', '비상교육', '미래엔', '교원', '대교', '웅진씽크빅', '능률', '금성출판사', 
      '동아출판', '지경사', '한국헤르만헤세', '한국톨스토이', '한국슈타이너', '한국전력',
      '여원미디어', '스마일북스', '성우주니어', '휘슬러', '연두비', '여원미디어'
    ],
    'EducationalThemes': [
      '인성동화', '감정그림책', '생활습관', '성교육', '경제동화', '창의동화', '사고력', '논술',
      '수학그림책', '과학그림책', '환경그림책', '역사동화', '지리동화', '예술동화', '음악그림책'
    ],
    'GradeLevels': [
      '유아 필독서', '7세 필독서', '초등 1학년', '초등 2학년', '초등 3학년', '초등 4학년', 
      '초등 5학년', '초등 6학년', '교과서 수록', '교과 연계'
    ],
    'PopularSeries': [
      '마법천자문', 'Why?', 'Who?', '흔한남매', '전천당', '만화 그리스 로마 신화',
      '엉덩이 탐정', '나무집', '수상한 시리즈', '코드네임', '용선생', '설민석'
    ]
  };

  const allKeywords = Object.values(categories).flat();
  const tempPath = path.resolve(process.cwd(), 'scripts/temp-curations.json');
  
  for (const kw of allKeywords) {
    let existing = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    if (existing.length >= 20000) { // Aim higher to account for duplicates
      console.log(`\n[COCO] 🏁 WAREHOUSE IS OVERFLOWING: ${existing.length} items.`);
      break;
    }

    console.log(`[COCO] MASSIVE HARVEST: "${kw}" (Warehouse: ${existing.length})`);
    
    let newBooks = [];
    for (let p = 1; p <= 10; p++) { // 10 pages per keyword!
      const results = await searchSeries(kw, p);
      if (results.length === 0) break;
      
      newBooks.push(...results.map(b => ({
        isbn13: b.isbn13,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        age_group: 0,
        loan_count: b.salesPoint || 0,
        is_purified: true,
        source: 'coco_massive_harvest'
      })));
      
      if (results.length < 50) break;
    }

    const combined = [...existing, ...newBooks];
    const unique = Array.from(new Map(combined.map(item => [item.isbn13, item])).values());
    fs.writeFileSync(tempPath, JSON.stringify(unique, null, 2));
    console.log(` ✅ Done. Unique total: ${unique.length}`);
  }

  console.log('\n[COCO] 🚀 Massive Harvesting Complete! Ready for DB Injection.');
}

main();