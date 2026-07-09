
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const total = await prisma.verified_books.count();
    const pending = await prisma.verified_books.count({ where: { verification_status: 'pending' } });
    const verified = await prisma.verified_books.count({ where: { verification_status: 'verified' } });

    console.log({ total, pending, verified });
}

check().catch(console.error).finally(() => prisma.$disconnect());
