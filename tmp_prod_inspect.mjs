const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, suspended: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  const streams = await prisma.stream.findMany({
    select: { id: true, creatorId: true, title: true, status: true, viewerCount: true, liveKitRoom: true, createdAt: true, startedAt: true, endedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  console.log(JSON.stringify({ users, streams }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
