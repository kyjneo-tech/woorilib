
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const books = [
    {
      isbn13: '9791164062362',
      title: '달 님 안 녕',
      author: '하야시 아키코',
      publisher: '한림출판사',
      age_group: 0,
      loan_count: 154020,
      buzz_count: 5200,
      age_density_ratio: 0.12,
      is_purified: true
    },
    {
        isbn13: '9788939205567',
        title: '두드려 보아요',
        author: '안나 클라라 티드홀름',
        publisher: '사계절',
        age_group: 0,
        loan_count: 82010,
        buzz_count: 3100,
        age_density_ratio: 0.08,
        is_purified: true
    },
    {
        isbn13: '9788949110011',
        title: '사과가 쿵!',
        author: '다다 히로시',
        publisher: '보림',
        age_group: 0,
        loan_count: 124500,
        buzz_count: 6500,
        age_density_ratio: 0.15,
        is_purified: true
    },
    {
        isbn13: '9788936440015',
        title: '강아지똥',
        author: '권정생',
        publisher: '길벗어린이',
        age_group: 3,
        loan_count: 98000,
        buzz_count: 4500,
        age_density_ratio: 0.09,
        is_purified: true
    }
  ];

  console.log('Seeding fake purified data...');
  for (const book of books) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO library_curations (isbn13, title, author, publisher, age_group, loan_count, buzz_count, age_density_ratio, is_purified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (isbn13, age_group) DO UPDATE SET is_purified = TRUE;
    `, book.isbn13, book.title, book.author, book.publisher, book.age_group, book.loan_count, book.buzz_count, book.age_density_ratio, book.is_purified);
  }
  console.log('Seed complete.');
  await prisma.$disconnect();
}

main();
