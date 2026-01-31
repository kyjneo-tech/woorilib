
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating bookshelf table...');
  try {
    // 1. Create Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.bookshelf (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        isbn TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        book_image TEXT,
        status TEXT DEFAULT 'want_to_read',
        added_at TIMESTAMPTZ DEFAULT NOW(),
        finished_at TIMESTAMPTZ,
        domain TEXT,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
        UNIQUE(user_id, isbn)
      );
    `);
    
    // 2. Create Indexes
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS idx_bookshelf_added_at ON public.bookshelf(added_at DESC);");
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS idx_bookshelf_status ON public.bookshelf(status);");
    await prisma.$executeRawUnsafe("CREATE INDEX IF NOT EXISTS idx_bookshelf_user_id ON public.bookshelf(user_id);");
    
    // 3. Enable RLS
    await prisma.$executeRawUnsafe("ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;");
    
    // 4. Create Policies
    // Drop existing first to avoid errors on rerun
    await prisma.$executeRawUnsafe("DROP POLICY IF EXISTS \"Users can manage their own bookshelf\" ON public.bookshelf;");
    
    // Allow ALL operations (SELECT, INSERT, UPDATE, DELETE) for the owner
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their own bookshelf" 
      ON public.bookshelf 
      FOR ALL 
      USING (auth.uid() = user_id);
    `);
    
    console.log('Bookshelf table created and RLS policies applied successfully.');
  } catch (e) {
    console.error('Error creating bookshelf table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
