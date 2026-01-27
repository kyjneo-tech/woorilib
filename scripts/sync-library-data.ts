
import { PrismaClient } from '@prisma/client';
import { libraryPurifier } from '../src/features/curation/engine/display/library-purifier';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Monthly Library Data Sync & Purification...');

    const ageGroups = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (const age of ageGroups) {
        console.log(`\nProcessing Age Group: ${age}`);
        const purifiedItems = await libraryPurifier.purifyAgeGroup(age, 30);
        
        console.log(`Found ${purifiedItems.length} candidates. Saving to DB...`);

        for (const item of purifiedItems) {
            try {
                // We use raw query as the schema might not be in Prisma yet
                // Or if it IS in Prisma, we use prisma.libraryCuration
                // For now, let's assume we use a raw query to bypass schema sync issues in this environment
                await prisma.$executeRaw`
                    INSERT INTO library_curations (isbn13, title, author, publisher, age_group, loan_count, buzz_count, age_density_ratio, is_purified)
                    VALUES (${item.isbn13}, ${item.title}, ${item.author}, ${item.publisher}, ${item.age_group}, ${item.loan_count}, ${item.buzz_count}, ${item.age_density_ratio}, ${item.is_purified})
                    ON CONFLICT (isbn13, age_group) 
                    DO UPDATE SET 
                        loan_count = EXCLUDED.loan_count,
                        buzz_count = EXCLUDED.buzz_count,
                        age_density_ratio = EXCLUDED.age_density_ratio,
                        is_purified = EXCLUDED.is_purified,
                        purified_at = NOW();
                `;
            } catch (e) {
                console.error(`Failed to save ${item.title}:`, e);
            }
        }
    }

    console.log('\n✨ Sync Complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
