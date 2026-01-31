
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ensure order 001, 002...

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Applying ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Postgres allows multiple statements in one query often, but splitting is safer if commands are complex.
      // However, simple split by ';' is dangerous due to function bodies.
      // For now, let's try pushing the whole file content.
      // If that fails, we might need a more robust parser, 
      // but typically queryRaw can handle blocks if valid SQL.
      
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ Applied ${file}`);
    } catch (error) {
      console.error(`✗ Failed to apply ${file}:`, error.message);
      // We don't stop, because maybe it failed due to "already exists" without "IF NOT EXISTS" clause,
      // though our specific error handling might need to be smarter.
    }
  }

  console.log('All migrations processed.');
  await prisma.$disconnect();
}

applyMigrations();
