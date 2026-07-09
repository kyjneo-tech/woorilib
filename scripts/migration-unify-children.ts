import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Children Data Unification...');

  // 1. Fetch all legacy children
  const legacyChildren = await (prisma as any).children.findMany();
  console.log(`📊 Found ${legacyChildren.length} legacy children to migrate.`);

  for (const child of legacyChildren) {
    console.log(`🔎 Processing child: ${child.name} (User: ${child.user_id})`);

    // 2. Find or Create matching ChildProfile
    let profile = await prisma.childProfile.findFirst({
      where: {
        userId: child.user_id,
        name: child.name
      }
    });

    if (profile) {
      console.log(`   ✨ Matching profile found. Updating...`);
      profile = await prisma.childProfile.update({
        where: { id: profile.id },
        data: {
          birthDate: child.birth_date,
          avatar: child.avatar,
          updatedAt: new Date()
        }
      });
    } else {
      console.log(`   ➕ No matching profile. Creating new one...`);
      profile = await prisma.childProfile.create({
        data: {
          userId: child.user_id,
          name: child.name,
          birthYear: new Date(child.birth_date).getFullYear(),
          birthDate: child.birth_date,
          avatar: child.avatar,
          ageGroup: 'unknown', // Default
        }
      });
    }

    // 3. Update related records to point to the NEW profile ID
    // Note: We need to use raw updates if Prisma models have already changed their relations
    console.log(`   🔗 Updating relations for child ${child.id} -> ${profile.id}`);
    
    await prisma.book_reviews.updateMany({
      where: { child_id: child.id },
      data: { child_id: profile.id }
    });

    await prisma.user_badges.updateMany({
      where: { child_id: child.id },
      data: { child_id: profile.id }
    });

    await prisma.user_challenges.updateMany({
      where: { child_id: child.id },
      data: { child_id: profile.id }
    });
  }

  console.log('✅ Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
