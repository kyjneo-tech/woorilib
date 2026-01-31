
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Tightening security permissions...');
  try {
    // 1. Revoke ALL for safety first
    await prisma.$executeRawUnsafe("REVOKE ALL ON TABLE public.collections FROM anon, authenticated;");
    await prisma.$executeRawUnsafe("REVOKE ALL ON TABLE public.bookshelf FROM anon, authenticated;");

    // 2. Grant SELECT only for consumers (anon, authenticated)
    // They should strictly READ curation data.
    await prisma.$executeRawUnsafe("GRANT SELECT ON TABLE public.collections TO anon, authenticated;");
    
    // Bookshelf: Users need CRUD but controlled by RLS.
    // However, for pure Postgres permissions, they need basic ALL or specific usage.
    // Usually 'authenticated' needs ALL on their own rows, but Postgres role-level grant is table-wide.
    // RLS restricts *which* rows. So granting ALL to 'authenticated' on 'bookshelf' is actually standard 
    // IF RLS is enabled and secure.
    // But 'anon' should definitely NOT have access to bookshelf (unless public profiles exist?).
    // Let's keep 'bookshelf' restrict to 'authenticated' for ALL, and 'anon' gets NOTHING (or SELECT if public).
    // For now, let's allow 'authenticated' -> ALL on bookshelf (RLS protects rows).
    await prisma.$executeRawUnsafe("GRANT ALL ON TABLE public.bookshelf TO authenticated;");
    // 'anon' gets NO access to bookshelf for now (removed from previous GRANT ALL).

    // 3. Service Role (Admin/Server properties) gets ALL
    await prisma.$executeRawUnsafe("GRANT ALL ON TABLE public.collections TO service_role;");
    await prisma.$executeRawUnsafe("GRANT ALL ON TABLE public.bookshelf TO service_role;");

    console.log('✅ Security fixed:');
    console.log('   - public.collections: SELECT only for public/users.');
    console.log('   - public.bookshelf: Access removed for anon, kept for users (RLS guarded).');

  } catch (e) {
    console.error('❌ Error fixing permissions:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
