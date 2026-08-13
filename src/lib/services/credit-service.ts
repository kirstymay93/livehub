import { prisma } from '@/lib/db';
import { Prisma, TransactionType } from '@prisma/client';

const CREDIT_STARTING_BALANCE = 1250;

type TipResult = {
  referenceId: string;
  senderBalance: number;
  creatorBalance: number;
};

function getPrismaErrorCode(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function isKnownPrismaError(error: unknown, code: string): boolean {
  return getPrismaErrorCode(error) === code;
}

function retryDelay(attempt: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(200, 25 * 2 ** attempt)));
}

function assertTransferIntegrity(
  transfer: Prisma.CreditTransferGetPayload<{ include: { ledgerEntries: true } }>,
  senderId: string,
  creatorId: string,
  amount: number
): TipResult {
  if (
    transfer.senderId !== senderId ||
    transfer.creatorId !== creatorId ||
    transfer.amount !== amount
  ) {
    throw new Error('Idempotency key was already used for a different tip');
  }

  const senderDebit = transfer.ledgerEntries.filter(
    (entry) =>
      entry.userId === senderId &&
      entry.type === TransactionType.TIP &&
      entry.amount === amount &&
      entry.relatedUserId === creatorId
  );
  const creatorEarning = transfer.ledgerEntries.filter(
    (entry) =>
      entry.userId === creatorId &&
      entry.type === TransactionType.EARNINGS &&
      entry.amount === amount &&
      entry.relatedUserId === senderId
  );

  if (transfer.ledgerEntries.length !== 2 || senderDebit.length !== 1 || creatorEarning.length !== 1) {
    throw new Error('Credit transfer ledger integrity violation');
  }

  return {
    referenceId: transfer.referenceId,
    senderBalance: 0,
    creatorBalance: 0,
  };
}

export class CreditService {
  static async getBalance(userId: string) {
    const balance = await prisma.creditBalance.upsert({
      where: { userId },
      create: { userId, balance: CREDIT_STARTING_BALANCE },
      update: {},
    });
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

  static async tipCreator(
    senderId: string,
    creatorId: string,
    amount: number,
    idempotencyKey: string,
    retryAttempt = 0
  ): Promise<TipResult> {
    if (senderId === creatorId) {
      throw new Error('You cannot tip yourself');
    }
    if (!Number.isInteger(amount) || amount < 1) {
      throw new Error('Tip amount must be a positive integer');
    }
    if (!idempotencyKey) {
      throw new Error('Idempotency key is required');
    }

    try {
      return await prisma.$transaction(
        async (tx) => {
          const existingTransfer = await tx.creditTransfer.findUnique({
            where: {
              senderId_idempotencyKey: { senderId, idempotencyKey },
            },
            include: { ledgerEntries: true },
          });

          if (existingTransfer) {
            const result = assertTransferIntegrity(
              existingTransfer,
              senderId,
              creatorId,
              amount
            );
            const [senderBalance, creatorBalance] = await Promise.all([
              tx.creditBalance.findUniqueOrThrow({
                where: { userId: senderId },
                select: { balance: true },
              }),
              tx.creditBalance.findUniqueOrThrow({
                where: { userId: creatorId },
                select: { balance: true },
              }),
            ]);
            return {
              ...result,
              senderBalance: senderBalance.balance,
              creatorBalance: creatorBalance.balance,
            };
          }

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

          const transfer = await tx.creditTransfer.create({
            data: {
              idempotencyKey,
              senderId,
              creatorId,
              amount,
            },
          });

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

          await tx.creditBalance.upsert({
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
                transferId: transfer.id,
              },
              {
                userId: creatorId,
                type: TransactionType.EARNINGS,
                amount,
                description: `Tip from ${creator.username}`,
                relatedUserId: senderId,
                transferId: transfer.id,
              },
            ],
          });

          const [senderBalance, persistedCreatorBalance] = await Promise.all([
            tx.creditBalance.findUniqueOrThrow({
              where: { userId: senderId },
              select: { balance: true },
            }),
            tx.creditBalance.findUniqueOrThrow({
              where: { userId: creatorId },
              select: { balance: true },
            }),
          ]);

          return {
            referenceId: transfer.referenceId,
            senderBalance: senderBalance.balance,
            creatorBalance: persistedCreatorBalance.balance,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
      );
    } catch (error) {
      if (isKnownPrismaError(error, 'P2034') && retryAttempt < 8) {
        await retryDelay(retryAttempt);
        return this.tipCreator(
          senderId,
          creatorId,
          amount,
          idempotencyKey,
          retryAttempt + 1
        );
      }
      if (!isKnownPrismaError(error, 'P2002')) {
        throw error;
      }

      const committedTransfer = await prisma.creditTransfer.findUnique({
        where: {
          senderId_idempotencyKey: { senderId, idempotencyKey },
        },
        include: { ledgerEntries: true },
      });
      if (!committedTransfer) {
        throw error;
      }

      const result = assertTransferIntegrity(
        committedTransfer,
        senderId,
        creatorId,
        amount
      );
      const [senderBalance, creatorBalance] = await Promise.all([
        prisma.creditBalance.findUniqueOrThrow({
          where: { userId: senderId },
          select: { balance: true },
        }),
        prisma.creditBalance.findUniqueOrThrow({
          where: { userId: creatorId },
          select: { balance: true },
        }),
      ]);

      return {
        ...result,
        senderBalance: senderBalance.balance,
        creatorBalance: creatorBalance.balance,
      };
    }
  }
}
