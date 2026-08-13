const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
    const email = 'creator.msqr6zjo@example.test';
    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    
    const user = await prisma.user.update({
      where: { email },
      data: { password: passwordHash },
    });
    console.log(`Password reset for ${user.username} successfully.`);
  } catch (error) {
    console.error('Reset failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
