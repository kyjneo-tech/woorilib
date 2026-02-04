import { AladinCollector } from '../../src/features/curation/collectors/aladin-collector';

// Seed Data for Top-Tier Collections
const TARGET_COLLECTIONS = [
  { publisher: '아람', title: '자연이랑', keywords: ['자연관찰'] },
  { publisher: '그레이트북스', title: '도레미곰', keywords: ['창작'] },
  { publisher: '키즈스콜레', title: '백일독서', keywords: ['독후활동'] },
  // Add more here...
];

async function main() {
  const args = process.argv.slice(2);
  const keywordArg = args.find(arg => arg.startsWith('--keyword='));
  
  // Optional: Filter by specific collection keyword
  const filterKeyword = keywordArg ? keywordArg.split('=')[1] : null;

  console.error(`[Collection Fetch] Starting... Filter: ${filterKeyword || 'ALL'}`);

  const results = [];

  for (const target of TARGET_COLLECTIONS) {
    if (filterKeyword && !target.title.includes(filterKeyword)) continue;

    console.error(`
📚 Processing: ${target.publisher} ${target.title}`);

    // 1. Fetch Parent Collection Info (The Set)
    const setQuery = `${target.publisher} ${target.title} 세트`;
    const setResults = await AladinCollector.search(setQuery, 1);
    
    if (setResults.length === 0) {
      console.error(`   ⚠️ Set not found for ${target.title}`);
      continue;
    }
    const setInfo = setResults[0];

    // 2. Fetch Child Books (The Components)
    // Query: "Publisher + Title" (without 'Set') usually returns single books
    const childQuery = `${target.publisher} ${target.title}`;
    // Fetch up to 50 items (Aladin max per page is usually 50)
    // We might need pagination logic here later for big collections (100+)
    const childBooks = await AladinCollector.search(childQuery, 50);

    // Filter out the 'Set' product itself from child list
    let validChildren = childBooks.filter(book => book.isbn13 !== setInfo.isbn13 && !book.title.includes('세트'));

    // --- [Upgrade] ISBN Pattern Validation ---
    // Logic: Books in the same collection usually share the same ISBN prefix (Publisher Code + Series Code)
    // We analyze the first 9-10 digits of ISBN13.
    
    if (validChildren.length > 5) {
      const prefixCounts: Record<string, number> = {};
      const PREFIX_LEN = 10; // Usually covers Country(3) + Publisher(4-5) + Series(2-3)

      validChildren.forEach(book => {
        if (!book.isbn13) return;
        const prefix = book.isbn13.substring(0, PREFIX_LEN);
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      });

      // Find the dominant prefix
      let dominantPrefix = '';
      let maxCount = 0;
      Object.entries(prefixCounts).forEach(([prefix, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantPrefix = prefix;
        }
      });

      // Strict Filtering: Allow books matching dominant prefix OR valid publisher name
      // (Sometimes ISBN changes mid-series, so we double check publisher name)
      const initialCount = validChildren.length;
      validChildren = validChildren.filter(book => {
         const hasPrefix = book.isbn13?.startsWith(dominantPrefix);
         const hasPublisher = book.publisher === target.publisher || book.publisher.includes(target.publisher);
         return hasPrefix || hasPublisher;
      });
      
      const removedCount = initialCount - validChildren.length;
      if (removedCount > 0) {
        console.error(`   🧹 Removed ${removedCount} outliers based on ISBN/Publisher check.`);
      }
    }
    // -----------------------------------------

    console.error(`   ✅ Found ${validChildren.length} single books.`);

    results.push({
      collection_info: setInfo,
      books: validChildren
    });
  }

  // Output structured JSON
  console.log(JSON.stringify(results, null, 2));
}

main();
