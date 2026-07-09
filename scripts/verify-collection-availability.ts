import dotenv from 'dotenv';
import path from 'path';
import { AladinCollector } from '../../src/features/curation/collectors/aladin-collector';
import { LibraryApiClient } from '../../src/entities/book/api/library-api.client';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Test Cases: Famous individual books from major collections
const TEST_CASES = [
  { collection: '안녕 마음아', title: '엄마가 100명이라면', publisher: '그레이트북스' }, // 안녕 마음아 대표작
  { collection: '자연이랑', title: '상어는 무서워', publisher: '아람' }, // 자연이랑 대표작
  { collection: '도레미곰', title: '앙앙의 턱받이', publisher: '그레이트북스' }, // 도레미곰 대표작
  { collection: '바나나 세계창작', title: '탑 쌓기', publisher: '아람' } 
];

async function main() {
  console.log('🕵️ Verifying Collection Availability in Libraries...
');

  for (const test of TEST_CASES) {
    console.log(`📘 Testing: [${test.collection}] "${test.title}" (${test.publisher})`);

    // 1. Get ISBN from Aladin (to ensure it's a valid book)
    const books = await AladinCollector.search(test.title, 5);
    // Filter by publisher to ensure it's the collection book, not a similar title
    const targetBook = books.find(b => b.publisher.includes(test.publisher));

    if (!targetBook) {
      console.log(`   ❌ Aladin Search Failed: Could not find ISBN for "${test.title}"`);
      continue;
    }

    console.log(`   ✅ ISBN Found: ${targetBook.isbn13} | Title: ${targetBook.title}`);

    // 2. Check Library Loan Count (Nationwide Popularity) via Data4Library
    // We use 'getPopularBooks' logic or specific book detail lookup
    const libraryClient = new LibraryApiClient();
    
    try {
      // Use 'srchDtlList' (getBookDetail) which returns loan history
      const libData = await libraryClient.getBookDetail(targetBook.isbn13);
      
      if (libData && libData.response.docs && libData.response.docs.length > 0) {
        const doc = libData.response.docs[0].doc;
        console.log(`   📊 Nationwide Loan Count: ${doc.loan_count}`);
        
        // 3. Check Availability in a sample region (e.g., Seoul - 11)
        const availability = await libraryClient.searchLibrariesByBook({
          isbn: targetBook.isbn13,
          region: '11', // Seoul
          pageSize: 1
        });

        console.log(`   🏫 Libraries in Seoul owning this book: ${availability.totalCount}`);
        
        if (Number(availability.totalCount) > 0) {
          console.log(`   🎉 VERIFIED: Available as single copy!`);
        } else {
          console.log(`   ⚠️ WARNING: Rare in libraries.`);
        }

      } else {
        console.log(`   ⚠️ Library Data Not Found (Might be indexed differently)`);
      }

    } catch (e) {
      console.error(`   ❌ Library API Error:`, e);
    }
    
    console.log('---------------------------------------------------
');
    
    // Slight delay
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(console.error);
