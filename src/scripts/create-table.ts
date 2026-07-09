
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating ClassificationRule table...');

    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."ClassificationRule" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "type" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "metadata" JSONB DEFAULT '{}'::JSONB,
        "priority" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6) NOT NULL,

        CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
    );
  `);

    await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ClassificationRule_type_idx" ON "public"."ClassificationRule"("type");
  `);

    console.log('Table created successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
