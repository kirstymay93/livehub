const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'creator_test_2026@example.com';
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'CREATOR' },
  });
  console.log(`User ${user.username} promoted to CREATOR successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
