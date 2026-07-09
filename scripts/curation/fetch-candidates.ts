import { AladinCollector } from '../../src/features/curation/collectors/aladin-collector';
import { BookEnrichmentService } from '../../src/features/curation/services/book-enrichment.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const keyword = args.find(arg => arg.startsWith('--keyword='))?.split('=')[1] || '육아';
  const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '5');
  const ageYears = parseInt(args.find(arg => arg.startsWith('--age='))?.split('=')[1] || '0');
  
  try {
    // 1. Fetch from Aladin
    let books = await AladinCollector.search(keyword, Math.min(count, 50));
    if (!books || books.length === 0) { console.log('[]'); return; }

    // 2. Enrich using Centralized Service
    const processedBooks = await BookEnrichmentService.enrichMany(books, { ageYears });

    console.log(JSON.stringify(processedBooks, null, 2));

  } catch (error) {
    console.error('Fetch Candidates Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();