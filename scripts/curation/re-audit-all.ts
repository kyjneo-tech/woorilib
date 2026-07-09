import { PrismaClient } from '@prisma/client';
import { BookEnrichmentService } from '../../src/features/curation/services/book-enrichment.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Global Re-Audit of all books in DB...');

  // 1. Fetch all books
  const books = await prisma.verified_books.findMany();
  console.log(`📊 Found ${books.length} books to re-audit.`);

  let count = 0;
  for (const book of books) {
    try {
      // 2. Enrich using Centralized Service
      // Map Prisma model back to BookSpec format for the service
      const bookSpec = {
        isbn13: book.isbn13 || '',
        title: book.title,
        author: book.author || '',
        publisher: book.publisher || '',
        pubDate: book.pub_date?.toISOString() || '',
        cover: book.cover_url || '',
        categoryName: book.type || '',
        description: book.description || '',
        priceStandard: book.price_standard || 0,
        link: '',
        salesPoint: 0,
        customerReviewRank: 0
      };

      const enriched = await BookEnrichmentService.enrich(bookSpec);

      // 3. Update DB with enriched data
      await prisma.verified_books.update({
        where: { isbn13: book.isbn13 || '' },
        data: {
          developmental_areas: enriched.developmental_areas,
          sub_competencies: enriched.sub_competencies,
          target_months_min: enriched.target_months_min,
          target_months_max: enriched.target_months_max,
          energy_level: enriched.energy_level,
          ai_comment: enriched.ai_comment,
          tags: enriched.tags,
          verification_status: enriched.verification_status,
          confidence_score: enriched.confidence_score,
          updated_at: new Date()
        }
      });

      count++;
      if (count % 50 === 0) console.log(`   ✅ Processed ${count}/${books.length}...`);
      
    } catch (e) {
      console.error(`   ❌ Failed to re-audit: ${book.title}`, e);
    }
  }

  console.log(`
🎉 Global Re-Audit Completed! ${count} books updated.`);
}

      count++;
      if (count % 50 === 0) console.log(`   ✅ Processed ${count}/${books.length}...`);
      
    } catch (e) {
      console.error(`   ❌ Failed to re-audit: ${book.title}`, e);
    }
  }

  console.log(`
🎉 Global Re-Audit Completed! ${count} books updated.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
