import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { CreditService } from "@/lib/services/credit-service";
import { TransactionType } from "@prisma/client";

const runIntegrationTests = process.env.CREDIT_INTEGRITY_TEST === "1";

describe.skipIf(!runIntegrationTests)("credit ledger integrity", () => {
  const runId = Date.now().toString(36);
  const testEmail = (label: string) => `${label}.${runId}@example.test`;
  const testUsername = (label: string) => `qa_${label}_${runId}`;

  let senderId = "";
  let creatorId = "";
  let secondSenderId = "";
  let rollbackSenderId = "";

  it("creates isolated synthetic users and starting balances", async () => {
    const [sender, creator, secondSender, rollbackSender] = await Promise.all([
      prisma.user.create({
        data: { email: testEmail("sender"), username: testUsername("sender") },
      }),
      prisma.user.create({
        data: {
          email: testEmail("creator"),
          username: testUsername("creator"),
          role: "CREATOR",
        },
      }),
      prisma.user.create({
        data: { email: testEmail("sender2"), username: testUsername("sender2") },
      }),
      prisma.user.create({
        data: { email: testEmail("rollback"), username: testUsername("rollback") },
      }),
    ]);

    [senderId, creatorId, secondSenderId, rollbackSenderId] = [
      sender.id,
      creator.id,
      secondSender.id,
      rollbackSender.id,
    ];

    await prisma.creditBalance.createMany({
      data: [
        { userId: senderId, balance: 1000 },
        { userId: creatorId, balance: 0 },
        { userId: secondSenderId, balance: 1000 },
        { userId: rollbackSenderId, balance: 50 },
      ],
    });
  });

  it("processes a tip exactly once and returns a unique reference", async () => {
    const key = `single-${runId}-00000000`;
    const result = await CreditService.tipCreator(senderId, creatorId, 100, key);

    expect(result.referenceId).toBeTruthy();
    expect(result.senderBalance).toBe(900);
    expect(result.creatorBalance).toBe(100);

    const transfer = await prisma.creditTransfer.findUnique({
      where: { senderId_idempotencyKey: { senderId, idempotencyKey: key } },
      include: { ledgerEntries: true },
    });
    expect(transfer).not.toBeNull();
    expect(transfer?.referenceId).toBe(result.referenceId);
    expect(transfer?.ledgerEntries).toHaveLength(2);
    expect(transfer?.ledgerEntries.map((entry) => entry.type).sort()).toEqual([
      TransactionType.EARNINGS,
      TransactionType.TIP,
    ]);
  });

  it("replays a duplicate request without debiting or crediting twice", async () => {
    const key = `duplicate-${runId}-0000000`;
    const first = await CreditService.tipCreator(senderId, creatorId, 25, key);
    const second = await CreditService.tipCreator(senderId, creatorId, 25, key);

    expect(second).toEqual(first);
    await expect(
      CreditService.tipCreator(senderId, creatorId, 30, key)
    ).rejects.toThrow("Idempotency key was already used for a different tip");

    expect(
      await prisma.creditTransfer.count({
        where: { senderId, idempotencyKey: key },
      })
    ).toBe(1);
    expect(
      await prisma.creditTransaction.count({
        where: { transfer: { senderId, idempotencyKey: key } },
      })
    ).toBe(2);
  });

  it("handles concurrent retries of the same request exactly once", async () => {
    const key = `concurrent-${runId}-000000`;
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        CreditService.tipCreator(senderId, creatorId, 10, key)
      )
    );

    expect(new Set(results.map((result) => result.referenceId)).size).toBe(1);
    expect(
      await prisma.creditTransfer.count({
        where: { senderId, idempotencyKey: key },
      })
    ).toBe(1);
    expect(
      await prisma.creditTransaction.count({
        where: { transfer: { senderId, idempotencyKey: key } },
      })
    ).toBe(2);
  });

  it("serializes concurrent distinct tips without negative balances", async () => {
    const keys = Array.from({ length: 10 }, (_, index) =>
      `race-${runId}-${index.toString().padStart(2, "0")}-0000`
    );
    const results = await Promise.all(
      keys.map((key) =>
        CreditService.tipCreator(secondSenderId, creatorId, 100, key)
      )
    );

    expect(new Set(results.map((result) => result.referenceId)).size).toBe(10);
    expect(
      await prisma.creditBalance.findUniqueOrThrow({
        where: { userId: secondSenderId },
      })
    ).toMatchObject({ balance: 0 });
  });

  it("rejects self-tips, non-creators, and negative or zero amounts", async () => {
    await expect(
      CreditService.tipCreator(senderId, senderId, 1, `self-${runId}-0000000`)
    ).rejects.toThrow("You cannot tip yourself");
    await expect(
      CreditService.tipCreator(senderId, secondSenderId, 1, `viewer-${runId}-0000`)
    ).rejects.toThrow("User is not a creator");
    await expect(
      CreditService.tipCreator(senderId, creatorId, 0, `zero-${runId}-0000000`)
    ).rejects.toThrow("Tip amount must be a positive integer");
    await expect(
      CreditService.tipCreator(senderId, creatorId, -1, `negative-${runId}-00`)
    ).rejects.toThrow("Tip amount must be a positive integer");
  });

  it("rolls back transfer creation and balances on insufficient funds", async () => {
    const key = `rollback-${runId}-000000`;
    await expect(
      CreditService.tipCreator(rollbackSenderId, creatorId, 100, key)
    ).rejects.toThrow("Insufficient credits");

    expect(
      await prisma.creditTransfer.count({
        where: { senderId: rollbackSenderId, idempotencyKey: key },
      })
    ).toBe(0);
    expect(
      await prisma.creditBalance.findUniqueOrThrow({
        where: { userId: rollbackSenderId },
      })
    ).toMatchObject({ balance: 50 });
  });

  it("keeps creator and sender balances consistent with their ledger entries", async () => {
    const [senderBalance, creatorBalance, senderTips, creatorEarnings] = await Promise.all([
      prisma.creditBalance.findUniqueOrThrow({ where: { userId: senderId } }),
      prisma.creditBalance.findUniqueOrThrow({ where: { userId: creatorId } }),
      prisma.creditTransaction.aggregate({
        where: { userId: senderId, type: TransactionType.TIP },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { userId: creatorId, type: TransactionType.EARNINGS },
        _sum: { amount: true },
      }),
    ]);

    expect(senderBalance.balance).toBe(1000 - (senderTips._sum.amount || 0));
    expect(creatorBalance.balance).toBe(creatorEarnings._sum.amount || 0);
  });

  it("enforces positive balances and unique reference identifiers at the database layer", async () => {
    await expect(
      prisma.creditBalance.update({
        where: { userId: senderId },
        data: { balance: -1 },
      })
    ).rejects.toThrow();

    const transfers = await prisma.creditTransfer.findMany({
      where: { OR: [{ senderId }, { senderId: secondSenderId }] },
      select: { referenceId: true },
    });
    expect(new Set(transfers.map((transfer) => transfer.referenceId)).size).toBe(
      transfers.length
    );

    await expect(
      prisma.creditTransfer.create({
        data: {
          idempotencyKey: `constraint-negative-${runId}`,
          senderId,
          creatorId,
          amount: -1,
        },
      })
    ).rejects.toThrow();

    await expect(
      prisma.creditTransfer.create({
        data: {
          idempotencyKey: `constraint-self-${runId}`,
          senderId,
          creatorId: senderId,
          amount: 1,
        },
      })
    ).rejects.toThrow();

    await expect(
      prisma.creditTransaction.create({
        data: {
          userId: senderId,
          type: TransactionType.TIP,
          amount: -1,
        },
      })
    ).rejects.toThrow();

    await expect(prisma.user.delete({ where: { id: creatorId } })).rejects.toThrow();
  });
});
