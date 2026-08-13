const { PrismaClient } = require('@prisma/client');

async function main() {
  const databaseUrl = 'postgresql://postgres.ionxddwcxvqlidddlmdk:Kl3428ll%23%23%23@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require';
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    const email = 'creator_test_2026@example.com';
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, role: true, email: true }
    });
    console.log('Target User:', JSON.stringify(user, null, 2));

    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, role: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Recent Users:', JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('Inspection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
