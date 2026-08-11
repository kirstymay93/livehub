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
          balance: 1250, // Starting balance
        },
      });
    }

    return balance.balance;
  }

  static async addCredits(userId: string, amount: number, description: string) {
    let balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      balance = await prisma.creditBalance.create({
        data: {
          userId,
          balance: amount,
        },
      });
    } else {
      balance = await prisma.creditBalance.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });
    }

    await prisma.creditTransaction.create({
      data: {
        userId,
        type: TransactionType.PURCHASE,
        amount,
        description,
      },
    });

    return balance.balance;
  }

  static async tipCreator(senderId: string, creatorId: string, amount: number) {
    // Get sender balance
    const senderBalance = await prisma.creditBalance.findUnique({
      where: { userId: senderId },
    });

    if (!senderBalance || senderBalance.balance < amount) {
      throw new Error('Insufficient credits');
    }

    // Verify creator exists
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Deduct from sender
    await prisma.creditBalance.update({
      where: { userId: senderId },
      data: { balance: { decrement: amount } },
    });

    // Add to creator
    let creatorBalance = await prisma.creditBalance.findUnique({
      where: { userId: creatorId },
    });

    if (!creatorBalance) {
      creatorBalance = await prisma.creditBalance.create({
        data: {
          userId: creatorId,
          balance: amount,
        },
      });
    } else {
      creatorBalance = await prisma.creditBalance.update({
        where: { userId: creatorId },
        data: { balance: { increment: amount } },
      });
    }

    // Create transactions
    await prisma.creditTransaction.create({
      data: {
        userId: senderId,
        type: TransactionType.TIP,
        amount,
        description: `Tip to ${creator.username}`,
        relatedUserId: creatorId,
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: creatorId,
        type: TransactionType.EARNINGS,
        amount,
        description: `Tip from ${creator.username}`,
        relatedUserId: senderId,
      },
    });

    return {
      senderBalance: senderBalance.balance - amount,
      creatorBalance: creatorBalance.balance,
    };
  }
}
