
import { libraryPurifier } from '../src/features/curation/engine/display/library-purifier';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('[COCO] 🚀 Starting Monthly Library Data Sync (File Export Mode)...');

    const ageGroups = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const allResults = [];

    for (const age of ageGroups) {
        console.log(`\n[COCO] 🚀 Massive Processing Age Group: ${age}`);
        // Increase from 30 to 100 items per age group
        const purifiedItems = await libraryPurifier.purifyAgeGroup(age, 100);
        console.log(`[COCO] ✅ Successfully harvested ${purifiedItems.length} high-quality books.`);
        allResults.push(...purifiedItems);
    }

    // Save to temp file
    const outputPath = path.resolve(process.cwd(), 'scripts/temp-curations.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

    console.log(`\n[COCO] ✨ Sync Complete. ${allResults.length} items saved to ${outputPath}`);
}

main().catch(e => {
    console.error('[COCO] ❌ Sync failed:', e);
    process.exit(1);
});
