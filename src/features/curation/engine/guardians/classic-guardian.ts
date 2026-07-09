
import { prisma } from '@/shared/lib/prisma';

export class ClassicGuardian {
    constructor() {
        // Prisma is initialized globally
    }

    /**
     * Main Mission: Protect the Classics
     * Ensures that 'Expert Pick' items maintain their status and data integrity.
     */
    async runMission(): Promise<void> {
        console.log('🛡️ [ClassicGuardian] Starting patrol...');

        // 1. Identify "Certified Classics" (Expert Picks)
        const collections = await prisma.collection.findMany({
            where: {
                NOT: {
                    features: {
                        equals: null as any
                    }
                }
            },
            select: {
                id: true,
                title: true,
                salesIndex: true,
                features: true
            }
        });

        // Filter for expert_pick in features
        const certified = collections.filter((c: any) =>
            c.features && typeof c.features === 'object' && (c.features as any).expert_pick === true
        );

        console.log(`🛡️ [ClassicGuardian] Found ${certified.length} Certified Classics.`);

        let restoredCount = 0;

        // 2. Enforce Minimum Standards (The "Foundation")
        for (const book of certified) {
            let needsUpdate = false;
            let updates: any = {};

            // Rule 1: Visual Truth - Classics must look popular
            const currentScore = book.salesIndex || 0;
            if (currentScore < 10000) {
                updates.salesIndex = 30000;
                needsUpdate = true;
                console.log(`🛡️ [ClassicGuardian] Restoring prestige for: ${book.title} (Score: ${currentScore} -> 30000)`);
            }

            if (needsUpdate) {
                try {
                    await prisma.collection.update({
                        where: { id: book.id },
                        data: updates
                    });
                    restoredCount++;
                } catch (updateError) {
                    console.error(`🛡️ [ClassicGuardian] Failed to restore ${book.title}`, updateError);
                }
            }
        }

        console.log(`🛡️ [ClassicGuardian] Patrol complete. Restored prestige for ${restoredCount} classics.`);
    }
}
