import { PrismaClient } from '@prisma/client';

// 🐾 Shared Prisma instance
// Note: 'server-only' removed to allow background script execution via tsx
console.log(`[PRISMA_DEBUG] Initializing Prisma Client (Process: ${process.pid}, Node: ${process.version})`);


const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
