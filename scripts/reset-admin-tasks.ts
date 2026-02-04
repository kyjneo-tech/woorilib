
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Clearing admin_tasks table...');
  await prisma.admin_tasks.deleteMany({});
  console.log('✅ Done. Refresh the Admin Operations page to re-seed.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
