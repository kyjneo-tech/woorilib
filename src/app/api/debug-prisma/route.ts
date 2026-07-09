
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let localPrisma: PrismaClient | null = null;
    try {
        console.log('Testing Local Instantiation Write...');

        localPrisma = new PrismaClient();

        const randomUserId = '00000000-0000-0000-0000-000000000000';

        try {
            await localPrisma.childProfile.create({
                data: {
                    userId: randomUserId,
                    name: 'Local Env Test Child',
                    birthYear: 2020,
                    ageGroup: '3-5'
                }
            });
            return NextResponse.json({ status: 'ok', message: 'Created (unexpectedly)' });
        } catch (dbError: any) {
            if (dbError.message.includes('Foreign key constraint failed')) {
                return NextResponse.json({ status: 'ok', message: 'Got expected FK error with local instance. Environment is stable.' });
            }
            throw dbError;
        }

    } catch (error: any) {
        console.error('Local Instantiation Error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    } finally {
        if (localPrisma) await localPrisma.$disconnect();
    }
}
