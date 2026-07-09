
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Force load env if not present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING; // Try direct connection strings

async function verify() {
    if (!dbUrl) {
        console.error('DATABASE_URL not found in env');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const resCollections = await client.query('SELECT count(*) FROM collections');
        const resVerified = await client.query('SELECT count(*) FROM verified_books');

        console.log('--- Verification Results ---');
        console.log(`Collections Count: ${resCollections.rows[0].count}`);
        console.log(`Verified Books Count: ${resVerified.rows[0].count}`);

        // Check for a specific known seeded item
        const example = await client.query("SELECT title, sales_index, features FROM collections WHERE features->>'expert_pick' = 'true' LIMIT 1");
        if (example.rows.length > 0) {
            console.log('Sample Certified Classic:', example.rows[0]);
        } else {
            console.warn('WARNING: No collections found with expert_pick = true');
        }

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await client.end();
    }
}

verify();
