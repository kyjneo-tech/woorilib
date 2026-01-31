
require('dotenv').config({ path: '.env.local' });
// Mock fetch for Node environment if needed, but Next.js 13+ polyfills it usually. 
// If generic node, might need 'node-fetch' if not on Node 18+.
// Assuming Node 18+ (fetch is global).

// We need to import the classes. Since they are TS, we can't run them directly in JS without compilation usually.
// But we have ts-node or similar? Or we can just use the compiled output if we build?
// Actually simpler: I'll rewrite the logic in a standalone JS script for verification 
// because importing TS modules into a JS script in this environment might be tricky with aliases (@/...).

async function runVerification() {
    const LIBRARY_API_KEY = process.env.LIBRARY_API_KEY;
    const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;

    console.log('--- Phase 1 Verification: Safety Curation ---');
    console.log('Target: Age 5-6 (Preschool), Region 11 (Seoul - Default)');

    // 1. Fetch Library Books (Mimic LibraryApiClient)
    const from_age = 5;
    const to_age = 6;
    const region = '11';
    const pageSize = 20;
    
    // Date Logic
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startDt = formatDate(thirtyDaysAgo);
    const endDt = formatDate(today);

    const libUrl = `http://data4library.kr/api/loanItemSrch?authKey=${LIBRARY_API_KEY}&from_age=${from_age}&to_age=${to_age}&region=${region}&pageSize=${pageSize}&startDt=${startDt}&endDt=${endDt}&format=json`;
    
    console.log(`\n1. Fetching Library Data... \n   ${libUrl}`);
    const libRes = await fetch(libUrl);
    const libData = await libRes.json();
    
    if (!libData.response || !libData.response.docs) {
        console.error('Library API Error:', libData);
        return;
    }

    const books = libData.response.docs.map(d => ({
        title: d.doc.bookname,
        isbn: d.doc.isbn13,
        author: d.doc.authors
    }));

    console.log(`   Fetched ${books.length} books.`);

    // 2. Verify with Aladin (Mimic MetadataVerificationService)
    console.log('\n2. Verifying with Aladin Metadata...');
    
    const safeBooks = [];
    const unsafeBooks = [];

    for (const book of books) {
        // Aladin Lookup
        const aladinUrl = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ALADIN_TTB_KEY}&itemIdType=ISBN13&ItemId=${book.isbn}&output=js&Version=20131101&OptResult=packing,mallType`;
        
        try {
            const aRes = await fetch(aladinUrl);
            const aData = await aRes.json();
            
            if (aData.item && aData.item.length > 0) {
                const item = aData.item[0];
                const category = item.categoryName || '';
                const isAdult = item.adult || false;
                
                // Safety Logic Check
                let isSafe = true;
                let reason = '';
                
                if (isAdult) { isSafe = false; reason = 'Adult Flag'; }
                
                const BLACKLIST = ['청소년', '성인', '19세', '로맨스', '스릴러', 'BL', 'GL'];
                for (const bad of BLACKLIST) {
                    if (category.includes(bad)) {
                        isSafe = false;
                        reason = `Keywords: ${bad}`;
                    }
                }

                // Strict Age Grade Check (Simulated)
                let ageGrade = 'ADULT';
                if (category.includes('유아')) ageGrade = 'TODDLER';
                else if (category.includes('어린이') || category.includes('초등')) ageGrade = 'SCHOOL';

                if (ageGrade !== 'TODDLER' && ageGrade !== 'SCHOOL') {
                    isSafe = false;
                    reason += ' (Not Toddler/School Category)';
                }

                const resultLog = `[${isSafe ? 'PASS' : 'FAIL'}] ${book.title.substring(0, 15)}... | Cat: ${category.substring(0, 30)}... | ${reason}`;
                console.log(resultLog);

                if (isSafe) safeBooks.push(book);
                else unsafeBooks.push({ ...book, reason });

            } else {
                console.log(`[SKIP] ${book.title} (Aladin No Data)`);
            }
        } catch (e) {
            console.error(`Error checking ${book.title}:`, e);
        }
        
        // Slight delay to avoid rate limit if running sequentially
        // await new Promise(r => setTimeout(r, 100)); 
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total Scanned: ${books.length}`);
    console.log(`Safe: ${safeBooks.length}`);
    console.log(`Unsafe: ${unsafeBooks.length}`);
    
    if (unsafeBooks.length > 0) {
        console.log('\n[Unsafe Samples]');
        unsafeBooks.slice(0, 3).forEach(b => console.log(`- ${b.title} (${b.reason})`));
    }
}

runVerification();
