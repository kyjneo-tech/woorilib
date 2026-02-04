
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStats {
  totalBooks: number;
  statusDistribution: { status: string; count: number }[];
  domainDistribution: { domain: string; count: number }[];
  recentLogs: any[];
}

export class AdminStatsService {
  static async getDashboardStats(): Promise<DashboardStats> {
    // 1. Total Count
    const totalBooks = await prisma.verified_books.count();

    // 2. Status Distribution (Group By)
    const statusGroups = await prisma.verified_books.groupBy({
      by: ['verification_status'],
      _count: {
        verification_status: true
      }
    });

    const statusDistribution = statusGroups.map(g => ({
      status: g.verification_status,
      count: g._count.verification_status
    }));

    // 3. Domain Distribution
    // Prisma doesn't support grouping by array elements easily.
    // We have to use raw query or fetch all tags (expensive).
    // For MVP, let's use a raw query for performance.
    // Note: development_areas is a text[] array.
    
    // Fallback: If raw query is risky, we can fetch metadata only? No, too many rows.
    // Use SQL: SELECT unnest(developmental_areas) as area, count(*) FROM verified_books GROUP BY area
    
    let domainDistribution: { domain: string; count: number }[] = [];
    try {
        const rawDomains = await prisma.$queryRaw<Array<{ area: string; count: bigint }>>`
            SELECT unnest(developmental_areas) as area, count(*)::int as count 
            FROM verified_books 
            GROUP BY area
            ORDER BY count DESC
        `;
        // Convert BigInt to number
        domainDistribution = rawDomains.map(d => ({
            domain: d.area,
            count: Number(d.count)
        }));
    } catch (e) {
        console.error('Raw query failed, skipping domain stats', e);
    }

    // 4. Recent Logs (Last 5 updated items)
    const recentLogs = await prisma.verified_books.findMany({
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        updated_at: true,
        verification_status: true,
        confidence_score: true
      }
    });

    return {
      totalBooks,
      statusDistribution,
      domainDistribution,
      recentLogs
    };
  }
}
