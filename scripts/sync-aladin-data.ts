
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ALADIN_API_KEY = process.env.ALADIN_TTB_KEY;
if (!ALADIN_API_KEY) {
  console.error('❌ ALADIN_TTB_KEY is missing in environment variables.');
  process.exit(1);
}

async function fetchAladinBestsellers(categoryId: string, maxResults: number = 50) {
  const url = `http://www.aladin.co.kr/ttb/api/ItemList.aspx?ttbkey=${ALADIN_API_KEY}&QueryType=Bestseller&MaxResults=${maxResults}&start=1&SearchTarget=Book&CategoryId=${categoryId}&Output=js&Version=20131101`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.item || [];
  } catch (e) {
    console.error(`[COCO] Failed to fetch category ${categoryId}`, e);
    return [];
  }
}

async function main() {
  console.log('[COCO] 🐾 Starting Aladin Bestseller Reinforcement...');
  
  // Category IDs: 1108 (Infant), 1106 (Children 1-2 grade), 1103 (Children 3-4 grade)
  const categories = [
    { id: '1108', label: 'Infant/Toddler' },
    { id: '1106', label: 'Children Lower' },
    { id: '13789', label: 'Picture Books' }
  ];

  let aladinResults = [];

  for (const cat of categories) {
    console.log(`[COCO] Harvesting Aladin [${cat.label}]...`);
    const books = await fetchAladinBestsellers(cat.id, 50);
    console.log(`[COCO] Found ${books.length} bestsellers.`);
    aladinResults.push(...books.map(b => ({
      isbn13: b.isbn13,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      age_group: cat.id === '1108' ? 0 : 7, // Map loosely
      loan_count: b.salesPoint || 0,
      is_purified: true,
      source: 'aladin'
    })));
  }

  // Merge with existing temp file
  const tempPath = path.resolve(process.cwd(), 'scripts/temp-curations.json');
  let existing = [];
  if (fs.existsSync(tempPath)) {
    existing = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
  }

  const combined = [...existing, ...aladinResults];
  // Deduplicate by ISBN
  const unique = Array.from(new Map(combined.map(item => [item.isbn13, item])).values());

  fs.writeFileSync(tempPath, JSON.stringify(unique, null, 2));
  console.log(`[COCO] ✨ Reinforcement Complete! Total unique books in warehouse: ${unique.length}`);
}

main();
