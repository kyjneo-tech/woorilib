
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envLocal = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (envLocal.error || !process.env.DATABASE_URL) {
    console.log('⚠️ .env.local not found or missing DATABASE_URL, trying .env');
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

async function createTable() {
    console.log('🛠 Creating collections table via Raw SQL...');
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();

        // Check if table exists
        const check = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE  table_schema = 'public'
                AND    table_name   = 'collections'
            );
        `);

        if (check.rows[0].exists) {
            console.log('✅ collections table already exists.');
        } else {
            // Create Table
            // columns matching Prisma schema maps
            await client.query(`
                CREATE TABLE public.collections (
                    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                    title text NOT NULL,
                    publisher text NOT NULL,
                    target_age_months_start integer,
                    target_age_months_end integer,
                    total_count integer,
                    category text,
                    features jsonb DEFAULT '{}'::jsonb,
                    summary text,
                    pros text[],
                    cons text[],
                    created_at timestamptz DEFAULT now(),
                    updated_at timestamptz DEFAULT now(),
                    blog_review_count integer DEFAULT 0 NOT NULL,
                    ranking_updated_at timestamp(3),
                    sales_index integer DEFAULT 0 NOT NULL,
                    cover_url text, -- Added this as it is used in seed script
                    UNIQUE (publisher, title)
                );
            `);
            console.log('✅ Created collections table.');
        }

        // RELOAD POSTGREST SCHEMA CACHE
        console.log('🔄 Reloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload config';");
        console.log('✅ Schema cache reloaded.');

    } catch (e) {
        console.error('❌ Error creating table:', e);
    } finally {
        await client.end();
    }
}

createTable();
