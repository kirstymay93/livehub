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
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'CREATOR' },
    });
    console.log(`User ${user.username} promoted to CREATOR successfully.`);
  } catch (error) {
    console.error('Promotion failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
