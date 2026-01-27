
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { NaverCollector } from '../src/features/curation/collectors/naver-collector';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const prisma = new PrismaClient();

const KNOWN_PENS = [
  { id: 'saypen', label: '세이펜' },
  { id: 'banapen', label: '바나펜' },
  { id: 'pororopen', label: '뽀로로펜' },
  { id: 'fishtalk', label: '피쉬톡' },
  { id: 'rainbowpen', label: '레인보우펜' },
  { id: 'thinkpen', label: '씽크펜' },
  { id: 'gookminpen', label: '국민펜' } // Just in case
];

async function runPenVerification() {
  console.log('🖊️ Starting Pen Compatibility Cross-Verification...');
  
  const collections = await prisma.collection.findMany();
  console.log(`📚 Found ${collections.length} collections.`);

  let updatedCount = 0;

  for (const col of collections) {
    console.log(`\n-----------------------------------`);
    console.log(`🔍 Verifying: ${col.title}`);
    
    // Existing features
    const currentFeatures: any = col.features || {};
    const newFeatures: Record<string, boolean> = { ...currentFeatures };
    
    let hasChanges = false;

    // 1. Base query for Ratio Calculation
    const baseQuery = `"${col.title}"`;
    const baseCount = await NaverCollector.getBlogReviewCount(baseQuery);

    // Check each pen
    for (const pen of KNOWN_PENS) {
      // 2. Co-occurrence Volume (Book + Pen)
      const coQuery = `"${col.title}" "${pen.label}"`;
      const coCount = await NaverCollector.getBlogReviewCount(coQuery);
      
      // 3. Smart Density Logic
      let isCompatible = false;
      let ratio = 0;

      if (baseCount < 50) {
        // Low volume book: Fallback to simple count (Strict Quoted)
        if (coCount >= 3) isCompatible = true;
      } else {
        // High volume book: Use Ratio to filter noise
        ratio = (coCount / baseCount) * 100;
        if (ratio >= 0.5) isCompatible = true;
      }
      
      console.log(`   ${pen.label}: ${coCount}/${baseCount} (${ratio.toFixed(2)}%) -> ${isCompatible ? '✅' : '❌'}`);

      if (isCompatible) {
        if (!newFeatures[pen.id]) {
            newFeatures[pen.id] = true;
            hasChanges = true;
        }
      } else {
        // Cleaning mode: If it was true but now fails ratio check, REVOKE it.
        if (newFeatures[pen.id]) {
             console.log(`   ❌ Revoking ${pen.label} (Ratio ${ratio.toFixed(2)}% < 0.5%)`);
             newFeatures[pen.id] = false;
             hasChanges = true;
        }
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    }

    if (hasChanges) {
        console.log(`   💾 Updating features...`);
        await prisma.collection.update({
            where: { id: col.id },
            data: { features: newFeatures }
        });
        updatedCount++;
    }
  }

  console.log(`\n✨ Pen Verification Completed! Updated ${updatedCount} collections.`);
  await prisma.$disconnect();
}

runPenVerification();
