
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Debugging Collections Data...');
  try {
    const totalCount = await prisma.collection.count();
    console.log(`Total Collections: ${totalCount}`);

    if (totalCount === 0) {
      console.log('No collections found. This is why the dashboard is empty.');
      return;
    }

    const categories = await prisma.collection.groupBy({
      by: ['category'],
      _count: {
        _all: true
      }
    });

    console.log('Collections by Category:');
    categories.forEach(c => {
      console.log(`- ${c.category}: ${c._count._all}`);
    });

    const sample = await prisma.collection.findFirst();
    console.log('Sample Collection:', sample);

  } catch (e) {
    console.error('Error querying collections:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
