import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreditPurchaseStatus } from '@prisma/client';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
  getStripeWebhookSecret: vi.fn(),
}));

const mockedPrisma = vi.mocked(prisma);

function makeTransactionClient(overrides: Record<string, unknown> = {}) {
  return {
    creditPurchase: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
      ...((overrides.creditPurchase as object | undefined) ?? {}),
    },
    creditBalance: {
      upsert: vi.fn(),
      ...((overrides.creditBalance as object | undefined) ?? {}),
    },
    creditTransaction: {
      create: vi.fn(),
      ...((overrides.creditTransaction as object | undefined) ?? {}),
    },
  };
}

describe('CreditPurchaseService atomic fulfillment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks a pending purchase paid and writes one balance and purchase ledger entry', async () => {
    const tx = makeTransactionClient();
    tx.creditPurchase.findUnique.mockResolvedValue({
      id: 'purchase-1',
      userId: 'viewer-1',
      packageId: 'starter',
      credits: 100,
      amount: 499,
      currency: 'usd',
      status: CreditPurchaseStatus.PENDING,
      ledgerEntry: null,
    });
    tx.creditPurchase.updateMany.mockResolvedValue({ count: 1 });
    vi.mocked(mockedPrisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await CreditPurchaseService.fulfillPaymentIntent({
      id: 'pi_test_1',
      status: 'succeeded',
      amount: 499,
      amount_received: 499,
      currency: 'usd',
      metadata: { purchaseId: 'purchase-1' },
    } as never);

    expect(result).toEqual({
      credited: true,
      purchaseId: 'purchase-1',
      credits: 100,
      status: CreditPurchaseStatus.PAID,
    });
    expect(tx.creditPurchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purchase-1', status: CreditPurchaseStatus.PENDING },
        data: expect.objectContaining({
          status: CreditPurchaseStatus.PAID,
          providerPaymentId: 'pi_test_1',
        }),
      })
    );
    expect(tx.creditBalance.upsert).toHaveBeenCalledWith({
      where: { userId: 'viewer-1' },
      create: { userId: 'viewer-1', balance: 100 },
      update: { balance: { increment: 100 } },
    });
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'viewer-1',
        type: 'PURCHASE',
        amount: 100,
        description: 'Credit purchase: starter',
        purchaseId: 'purchase-1',
      },
    });
  });

  it('does not credit a purchase twice when a duplicate verified event arrives', async () => {
    const tx = makeTransactionClient();
    tx.creditPurchase.findUnique.mockResolvedValue({
      id: 'purchase-1',
      userId: 'viewer-1',
      packageId: 'starter',
      credits: 100,
      amount: 499,
      currency: 'usd',
      status: CreditPurchaseStatus.PAID,
      providerPaymentId: 'pi_test_1',
      ledgerEntry: { id: 'ledger-1' },
    });
    vi.mocked(mockedPrisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await CreditPurchaseService.fulfillPaymentIntent({
      id: 'pi_test_1',
      status: 'succeeded',
      amount: 499,
      amount_received: 499,
      currency: 'usd',
      metadata: { purchaseId: 'purchase-1' },
    } as never);

    expect(result.credited).toBe(false);
    expect(tx.creditPurchase.updateMany).not.toHaveBeenCalled();
    expect(tx.creditBalance.upsert).not.toHaveBeenCalled();
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects a verified payment whose amount or currency differs from the server purchase', async () => {
    const tx = makeTransactionClient();
    tx.creditPurchase.findUnique.mockResolvedValue({
      id: 'purchase-1',
      userId: 'viewer-1',
      packageId: 'starter',
      credits: 100,
      amount: 499,
      currency: 'usd',
      status: CreditPurchaseStatus.PENDING,
      ledgerEntry: null,
    });
    vi.mocked(mockedPrisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    await expect(
      CreditPurchaseService.fulfillPaymentIntent({
        id: 'pi_test_forged',
        status: 'succeeded',
        amount: 1,
        amount_received: 1,
        currency: 'usd',
        metadata: { purchaseId: 'purchase-1' },
      } as never)
    ).rejects.toThrow('Verified payment does not match the server purchase');

    expect(tx.creditBalance.upsert).not.toHaveBeenCalled();
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
  });
});
