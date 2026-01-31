
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Granting table permissions...');
  try {
    // Grant Usage on Schema
    await prisma.$executeRawUnsafe("GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;");

    // Grant Access to Collections Table
    await prisma.$executeRawUnsafe("GRANT ALL ON TABLE public.collections TO postgres, anon, authenticated, service_role;");
    
    // Grant Access to Bookshelf Table (Preventive)
    await prisma.$executeRawUnsafe("GRANT ALL ON TABLE public.bookshelf TO postgres, anon, authenticated, service_role;");

    console.log('✅ Granted ALL permissions on "collections" and "bookshelf" to anon, authenticated, service_role.');

  } catch (e) {
    console.error('❌ Error granting permissions:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
