import { prisma } from "@/lib/db";

export class CreditService {
  static async getBalance(userId: string): Promise<number> {
    const balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });
    return balance?.balance ?? 0;
  }

  static async addCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.creditBalance.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount,
          description,
        },
      });
    });
  }

  static async removeCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const balance = await tx.creditBalance.findUnique({
        where: { userId },
      });

      if (!balance || balance.balance < amount) {
        throw new Error("Insufficient credits");
      }

      await tx.creditBalance.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "REFUND",
          amount,
          description,
        },
      });
    });
  }

  static async tipCreator(
    tipperUserId: string,
    creatorUserId: string,
    amount: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Deduct from tipper
      const tipperBalance = await tx.creditBalance.findUnique({
        where: { userId: tipperUserId },
      });

      if (!tipperBalance || tipperBalance.balance < amount) {
        throw new Error("Insufficient credits");
      }

      await tx.creditBalance.update({
        where: { userId: tipperUserId },
        data: { balance: { decrement: amount } },
      });

      // Add to creator
      await tx.creditBalance.upsert({
        where: { userId: creatorUserId },
        update: { balance: { increment: amount } },
        create: { userId: creatorUserId, balance: amount },
      });

      // Record transactions
      await tx.creditTransaction.create({
        data: {
          userId: tipperUserId,
          type: "TIP",
          amount,
          description: `Tip to creator ${creatorUserId}`,
          relatedUserId: creatorUserId,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: creatorUserId,
          type: "EARNINGS",
          amount,
          description: `Tip from user ${tipperUserId}`,
          relatedUserId: tipperUserId,
        },
      });
    });
  }

  static async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
