
import { AladinCollector, BookSpec } from '../../collectors/aladin-collector';

// Aladin Category IDs for Children
// 1108: 유아 (0-7세) -> 2551(그림책), 2553(동화), ...
// 1137: 어린이 (8세+)
const CATEGORY_IDS = {
  INFANT_0_3: 1108, // General Infant (Need deeper sub-categories ideally, but 1108 covers 0-7)
  CHILD_4_7: 1108,
  ELEMENTARY_LOW: 1137, 
  PICTURE_BOOK: 2551, // 그림책 (Best for 0-5)
  FAIRY_TALE: 2553 // 동화
};

/**
 * Single Book Collector
 * Focuses on individual bestsellers, award winners, and famous authors.
 */
export class SingleBookCollector {
  
  /**
   * Fetch Steady Sellers (Bestsellers) by Category
   * @param count Number of books to fetch per category
   */
  static async getSteadySellers(count = 20): Promise<BookSpec[]> {
    console.log('📚 Fetching Single Book Steady Sellers...');
    let allBooks: BookSpec[] = [];

    // 1. Picture Books (0-5yo core)
    const pictureBooks = await AladinCollector.getBestseller({ 
      categoryId: CATEGORY_IDS.PICTURE_BOOK, 
      maxResults: count 
    });
    allBooks = [...allBooks, ...pictureBooks];
    console.log(`   - Picture Books: Found ${pictureBooks.length}`);

    // 2. Elementary Low (6-8yo)
    const elementaryBooks = await AladinCollector.getBestseller({ 
      categoryId: CATEGORY_IDS.ELEMENTARY_LOW, 
      maxResults: count 
    });
    // Filter slightly to ensure compatibility? Or rely on detailed tagging later.
    allBooks = [...allBooks, ...elementaryBooks];
    console.log(`   - Elementary Books: Found ${elementaryBooks.length}`);

    return this.deduplicate(allBooks);
  }

  /**
   * Fetch by Famous Authors (The "Trustworthy" strategy)
   */
  static async getByAuthors(authors: string[]): Promise<BookSpec[]> {
    console.log('✍️  Fetching by Famous Authors...');
    let allBooks: BookSpec[] = [];

    for (const author of authors) {
      // Search logic might need tuning: "AuthorName" query
      const results = await AladinCollector.search(`${author}`, 5); // Top 5 per author
      allBooks = [...allBooks, ...results];
      console.log(`   - ${author}: Found ${results.length}`);
    }

    return this.deduplicate(allBooks);
  }
  
  private static deduplicate(books: BookSpec[]): BookSpec[] {
    const seen = new Set();
    return books.filter(b => {
      if (seen.has(b.isbn13)) return false;
      seen.add(b.isbn13);
      return true;
    });
  }
}
