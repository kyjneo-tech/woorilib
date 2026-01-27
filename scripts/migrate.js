/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  // Try .env if .env.local missing
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

async function migrate() {
  console.log('🔄 Starting migration process...');

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Missing DIRECT_URL or DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationDir = path.resolve(__dirname, '../supabase/migrations');
    if (!fs.existsSync(migrationDir)) {
      throw new Error(`Migration directory not found at ${migrationDir}`);
    }

    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      console.log(`\n📄 Executing ${file}...`);
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await client.query(sql);
      console.log(`✅ Success: ${file}`);
    }

    console.log('\n✨ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
