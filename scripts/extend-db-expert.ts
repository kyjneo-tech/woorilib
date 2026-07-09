
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('[COCO] 🐾 Extending Database for Expert Mode...');
  try {
    // Add Readability Level (1-5)
    await prisma.$executeRawUnsafe(`ALTER TABLE public.verified_books ADD COLUMN IF NOT EXISTS readability_level integer DEFAULT 3;`);
    
    // Add Expert Certification Flag
    await prisma.$executeRawUnsafe(`ALTER TABLE public.verified_books ADD COLUMN IF NOT EXISTS is_expert_certified boolean DEFAULT false;`);
    
    console.log('[COCO] ✅ Database schema expanded successfully!');
  } catch (e: any) {
    console.error('[COCO] ❌ Schema extension failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
