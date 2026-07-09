
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();
const ALADIN_API_KEY = process.env.ALADIN_TTB_KEY;

if (!ALADIN_API_KEY) {
  console.error('❌ ALADIN_TTB_KEY is missing in .env.local');
  process.exit(1);
}

async function fetchAladinCategory(isbn13: string) {
  const url = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ALADIN_API_KEY}&itemIdType=ISBN13&ItemId=${isbn13}&output=js&Version=20131101`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.item && data.item.length > 0) {
      return data.item[0].categoryName;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function runFullAladinAudit() {
  console.log('🐾 [COCO] 🚀 Starting FULL SYSTEM AUDIT...');
  
  let totalRejected = 0;
  let totalVerified = 0;
  let totalSkipped = 0;

  while (true) {
    // 아직 감사가 완료되지 않은 'verified' 도서 100권씩 가져오기
    const books = await prisma.verified_books.findMany({
      where: { 
        verification_status: 'verified',
        isbn13: { not: null },
        NOT: {
          ai_comment: { contains: '[감사 완료]' }
        }
      },
      take: 100
    });

    if (books.length === 0) break;

    console.log(`\n📦 [COCO] Auditing batch of ${books.length} books... (Total Verified: ${totalVerified}, Rejected: ${totalRejected})`);

    for (const book of books) {
      const categoryPath = await fetchAladinCategory(book.isbn13!);
      
      if (!categoryPath) {
        totalSkipped++;
        process.stdout.write('.');
        continue;
      }

      const isKidsBook = /어린이|유아|전집|아동|청소년/.test(categoryPath);
      const isAdultBook = /수험서|자격증|공무원|전공|기술|공학|경영|인적성|토익|취업/.test(categoryPath);

      if (isAdultBook && !isKidsBook) {
        console.log(`\n🚫 [REJECT] ${book.title} | ${categoryPath}`);
        await prisma.verified_books.update({
          where: { id: book.id },
          data: {
            verification_status: 'rejected',
            ai_comment: `[자동 거절] 알라딘 카테고리 분석 결과 성인용(${categoryPath})으로 확인됨.`,
            developmental_areas: [],
            sub_competencies: [],
            emotional_keywords: [],
            confidence_score: 100
          }
        });
        totalRejected++;
      } else {
        // 안전한 아동 도서로 판명됨 (또는 최소한 성인용은 아님)
        await prisma.verified_books.update({
          where: { id: book.id },
          data: {
            ai_comment: (book.ai_comment || '') + ' [감사 완료]',
            verification_status: 'verified' // 유지
          }
        });
        totalVerified++;
        process.stdout.write('✅');
      }

      // API 레이트 리밋 준수 (초당 약 7회)
      await new Promise(resolve => setTimeout(resolve, 140));
    }
  }

  console.log(`\n\n✨ [COCO] MISSION COMPLETE!`);
  console.log(`✅ Total Kids Books Verified: ${totalVerified}`);
  console.log(`🚫 Total Adult Books Purged: ${totalRejected}`);
  console.log(`❓ Skipped (No metadata): ${totalSkipped}`);
  console.log(`🐾 The library is now clean and safe for children! 멍!`);
}

runFullAladinAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
