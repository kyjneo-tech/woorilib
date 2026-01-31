
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing RLS policies for collections table...');
  try {
    // 1. Enable RLS (Ensure it's on)
    await prisma.$executeRawUnsafe("ALTER TABLE IF EXISTS public.collections ENABLE ROW LEVEL SECURITY;");
    
    // 2. Drop existing policy if any (to avoid conflict)
    await prisma.$executeRawUnsafe("DROP POLICY IF EXISTS \"Public read access\" ON public.collections;");
    
    // 3. Create Public Read Policy
    // This allows anyone (anon or authenticated) to SELECT rows
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public read access" 
      ON public.collections 
      FOR SELECT 
      USING (true);
    `);
    
    console.log('✅ Policy "Public read access" applied to collections table.');
    
    // Verify count just to be sure we can read (as admin)
    const count = await prisma.collection.count();
    console.log(`Current collection count: ${count}`);

  } catch (e) {
    console.error('❌ Error applying policy:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
