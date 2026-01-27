
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying library_curation migration...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS library_curations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        isbn13 TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        cover_url TEXT,
        age_group INTEGER NOT NULL,
        loan_count INTEGER DEFAULT 0,
        buzz_count INTEGER DEFAULT 0,
        age_density_ratio FLOAT,
        is_purified BOOLEAN DEFAULT FALSE,
        purified_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(isbn13, age_group)
      );
    `);
    
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS idx_lib_curation_age ON library_curations(age_group);");
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS idx_lib_curation_purified ON library_curations(is_purified);");
    
    await prisma.$executeRawUnsafe("ALTER TABLE library_curations ENABLE ROW LEVEL SECURITY;");
    await prisma.$executeRawUnsafe("DROP POLICY IF EXISTS \"Public read access library_curations\" ON library_curations;");
    await prisma.$executeRawUnsafe("CREATE POLICY \"Public read access library_curations\" ON library_curations FOR SELECT USING (true);");
    
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Error applying migration:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
