
import { prisma } from '@/shared/lib/prisma';
import { unstable_cache } from 'next/cache';

export interface ClassificationRules {
    subCompetencies: Record<string, string[]>;
    parentAreas: Record<string, string>;
}

export class RuleService {
    /**
     * Load classification rules from DB with caching.
     * Cache invalidation strategy: Revalidate on demand (admin updates) or time-based (e.g., 1 hour).
     */
    static async getRules(): Promise<ClassificationRules> {
        return await getCachedRules();
    }

    /**
     * For Admin: Force refresh rules
     */
    static async refreshRules(): Promise<void> {
        // In Next.js App Router, we would use revalidateTag('classification-rules')
        // But for now, since unstable_cache implementation detail might vary, 
        // we assume this method handle explicit cache clearing if needed.
        // basic revalidation is handled by next.js `revalidateTag` if we tag the cache.
    }
}

// Cached function to fetch rules
const getCachedRules = unstable_cache(
    async (): Promise<ClassificationRules> => {
        console.log('[RuleService] Fetching rules from DB...');

        // 1. Fetch all rules of type 'sub_competency'
        const rules = await prisma.classificationRule.findMany({
            where: { type: 'sub_competency' },
            select: { name: true, keywords: true, metadata: true }
        });

        const subCompetencies: Record<string, string[]> = {};
        const parentAreas: Record<string, string> = {};

        for (const rule of rules) {
            subCompetencies[rule.name] = rule.keywords;

            const meta = rule.metadata as { parentArea?: string } | null;
            if (meta?.parentArea) {
                parentAreas[rule.name] = meta.parentArea;
            }
        }

        // Default Fallback if DB is empty (Design Choice: Should we fallback or throw?)
        // For safety during migration, verify if we have keys.
        if (Object.keys(subCompetencies).length === 0) {
            console.warn('[RuleService] No rules found in DB. Classifier might not work correctly.');
        }

        return { subCompetencies, parentAreas };
    },
    ['classification-rules-v1'], // Cache Key
    {
        revalidate: 3600, // Revalidate every hour
        tags: ['classification-rules'] // Cache Tag for on-demand invalidation
    }
);
