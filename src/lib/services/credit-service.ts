import { prisma } from '@/lib/db';
import { TransactionType } from '@prisma/client';

export class CreditService {
  static async getBalance(userId: string) {
    let balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.creditBalance.create({
        data: {
          userId,
          balance: 1250,
        },
      });
    }

    return balance.balance;
  }

  static async addCredits(userId: string, amount: number, description: string) {
    if (!Number.isInteger(amount) || amount < 1) {
      throw new Error('Credit amount must be a positive integer');
    }

    return prisma.$transaction(async (tx) => {
      const balance = await tx.creditBalance.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.PURCHASE,
          amount,
          description,
        },
      });

      return balance.balance;
    });
  }

  static async tipCreator(senderId: string, creatorId: string, amount: number) {
    if (senderId === creatorId) {
      throw new Error('You cannot tip yourself');
    }
    if (!Number.isInteger(amount) || amount < 1) {
      throw new Error('Tip amount must be a positive integer');
    }

    return prisma.$transaction(async (tx) => {
      const creator = await tx.user.findUnique({
        where: { id: creatorId },
        select: { id: true, username: true, role: true },
      });

      if (!creator) {
        throw new Error('Creator not found');
      }
      if (creator.role !== 'CREATOR') {
        throw new Error('User is not a creator');
      }

      const senderUpdate = await tx.creditBalance.updateMany({
        where: {
          userId: senderId,
          balance: { gte: amount },
        },
        data: { balance: { decrement: amount } },
      });

      if (senderUpdate.count !== 1) {
        throw new Error('Insufficient credits');
      }

      const creatorBalance = await tx.creditBalance.upsert({
        where: { userId: creatorId },
        create: { userId: creatorId, balance: amount },
        update: { balance: { increment: amount } },
      });

      await tx.creditTransaction.createMany({
        data: [
          {
            userId: senderId,
            type: TransactionType.TIP,
            amount,
            description: `Tip to ${creator.username}`,
            relatedUserId: creatorId,
          },
          {
            userId: creatorId,
            type: TransactionType.EARNINGS,
            amount,
            description: `Tip from ${creator.username}`,
            relatedUserId: senderId,
          },
        ],
      });

      const senderBalance = await tx.creditBalance.findUniqueOrThrow({
        where: { userId: senderId },
        select: { balance: true },
      });

      return {
        senderBalance: senderBalance.balance,
        creatorBalance: creatorBalance.balance,
      };
    });
  }
}
