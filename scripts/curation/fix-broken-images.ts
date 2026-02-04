import { PrismaClient } from '@prisma/client';
import { NaverCollector } from '../../src/features/curation/collectors/naver-collector';

const prisma = new PrismaClient();

async function checkUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('🖼️ Starting Image Repair Operation...');

  // 1. Fetch all books
  const books = await prisma.verified_books.findMany({
    select: { isbn13: true, title: true, cover_url: true, cover_url_naver: true }
  });

  console.log(`📊 Total books to check: ${books.length}`);

  let repairedCount = 0;
  let skipCount = 0;

  for (const book of books) {
    // 2. Check if current cover is broken or missing
    const isPrimaryOk = await checkUrl(book.cover_url || '');
    
    if (isPrimaryOk) {
      skipCount++;
      continue;
    }

    // 3. Primary is broken! Try to repair using Naver
    try {
      console.log(`   🛠️ Repairing: ${book.title}...`);
      const naverResults = await NaverCollector.searchBook(book.isbn13 || book.title, 1);
      
      if (naverResults && naverResults.length > 0 && naverResults[0].image) {
        const newUrl = naverResults[0].image;
        
        await prisma.verified_books.update({
          where: { isbn13: book.isbn13! },
          data: {
            cover_url: newUrl,
            cover_url_naver: newUrl,
            updated_at: new Date()
          }
        });
        repairedCount++;
        console.log(`      ✅ Fixed with Naver URL!`);
      } else {
        console.log(`      ❌ No Naver image found for this book.`);
      }
    } catch (e) {
      console.error(`      ❌ Error repairing ${book.title}`);
    }

    // Rate limiting for Naver API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`
🎉 Repair Operation Completed!`);
  console.log(`✅ Repaired: ${repairedCount}`);
  console.log(`⏭️  Skipped (Already OK): ${skipCount}`);
}

main().finally(() => prisma.$disconnect());
