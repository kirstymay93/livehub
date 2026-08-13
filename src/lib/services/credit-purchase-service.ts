import { CreditPurchaseStatus, Prisma, TransactionType } from '@prisma/client';
import type Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { getCreditPackage } from '@/lib/credits/packages';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

const PAYMENT_PROVIDER = 'stripe';

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('Application URL is not configured');
  }
  return appUrl.replace(/\/$/, '');
}

function getPaymentIntentId(paymentIntent: Stripe.PaymentIntent | string | null): string | null {
  if (!paymentIntent) return null;
  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
}

function getCurrency(currency: string | null): string {
  return (currency ?? '').toLowerCase();
}

export class CreditPurchaseService {
  static async createCheckoutSession(
    userId: string,
    packageId: string,
    requestId: string = randomUUID()
  ) {
    const creditPackage = getCreditPackage(packageId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const existingPurchase = await prisma.creditPurchase.findUnique({
      where: { requestId },
    });

    if (existingPurchase) {
      if (existingPurchase.userId !== userId) {
        throw new Error('Idempotency key belongs to another user');
      }
      if (existingPurchase.packageId !== creditPackage.id) {
        throw new Error('Idempotency key was already used for another package');
      }
      if (!existingPurchase.providerCheckoutId) {
        throw new Error('Checkout is still being prepared; retry with a new request');
      }

      if (existingPurchase.status === CreditPurchaseStatus.PAID) {
        return {
          purchaseId: existingPurchase.id,
          checkoutSessionId: existingPurchase.providerCheckoutId,
          checkoutUrl: null,
          status: existingPurchase.status,
        };
      }

      const checkoutSession = await getStripe().checkout.sessions.retrieve(
        existingPurchase.providerCheckoutId
      );
      return {
        purchaseId: existingPurchase.id,
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        status: existingPurchase.status,
      };
    }

    const purchase = await prisma.creditPurchase.create({
      data: {
        userId,
        provider: PAYMENT_PROVIDER,
        requestId,
        packageId: creditPackage.id,
        credits: creditPackage.credits,
        currency: creditPackage.currency,
        amount: creditPackage.amount,
      },
    });

    try {
      const session = await getStripe().checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: creditPackage.currency,
                product_data: {
                  name: `${creditPackage.name} credits`,
                  description: `${creditPackage.credits} LiveHub credits`,
                },
                unit_amount: creditPackage.amount,
              },
              quantity: 1,
            },
          ],
          customer_email: user.email,
          client_reference_id: purchase.id,
          metadata: {
            purchaseId: purchase.id,
            userId,
            packageId: creditPackage.id,
          },
          payment_intent_data: {
            metadata: {
              purchaseId: purchase.id,
              userId,
              packageId: creditPackage.id,
            },
          },
          success_url: `${getAppUrl()}/wallet?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getAppUrl()}/wallet?purchase=cancelled`,
        },
        { idempotencyKey: `livehub-purchase-${purchase.id}` }
      );

      await prisma.creditPurchase.update({
        where: { id: purchase.id },
        data: { providerCheckoutId: session.id },
      });

      return {
        purchaseId: purchase.id,
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
        status: purchase.status,
      };
    } catch (error) {
      console.error('Stripe checkout creation failed:', error);
      await this.markFailed(purchase.id);
      throw new Error('Unable to create checkout session');
    }
  }

  static async fulfillCheckoutSession(session: Stripe.Checkout.Session) {
    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return { credited: false, reason: 'Payment is not complete' };
    }

    const purchaseId = session.metadata?.purchaseId;
    const providerPaymentId = getPaymentIntentId(session.payment_intent);
    if (!purchaseId || !providerPaymentId) {
      throw new Error('Stripe checkout session is missing payment metadata');
    }

    return this.grantCredits({
      purchaseId,
      providerCheckoutId: session.id,
      providerPaymentId,
      amount: session.amount_total,
      currency: getCurrency(session.currency),
    });
  }

  static async fulfillPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.status !== 'succeeded') {
      return { credited: false, reason: 'Payment is not successful' };
    }

    const purchaseId = paymentIntent.metadata?.purchaseId;
    if (!purchaseId) {
      throw new Error('Stripe payment intent is missing purchase metadata');
    }

    return this.grantCredits({
      purchaseId,
      providerPaymentId: paymentIntent.id,
      amount: paymentIntent.amount_received || paymentIntent.amount,
      currency: getCurrency(paymentIntent.currency),
    });
  }

  private static async grantCredits(input: {
    purchaseId: string;
    providerCheckoutId?: string;
    providerPaymentId: string;
    amount: number | null;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.creditPurchase.findUnique({
        where: { id: input.purchaseId },
        include: { ledgerEntry: true },
      });
      if (!purchase) {
        throw new Error('Credit purchase not found');
      }

      if (purchase.status === CreditPurchaseStatus.PAID) {
        if (
          purchase.providerPaymentId &&
          purchase.providerPaymentId !== input.providerPaymentId
        ) {
          throw new Error('Purchase is linked to a different payment');
        }
        return {
          credited: false,
          purchaseId: purchase.id,
          credits: purchase.credits,
          status: purchase.status,
        };
      }

      if (purchase.status !== CreditPurchaseStatus.PENDING) {
        throw new Error('Purchase is not payable');
      }

      if (
        input.amount !== purchase.amount ||
        input.currency !== purchase.currency ||
        input.amount === null
      ) {
        throw new Error('Verified payment does not match the server purchase');
      }

      const statusUpdate = await tx.creditPurchase.updateMany({
        where: {
          id: purchase.id,
          status: CreditPurchaseStatus.PENDING,
        },
        data: {
          status: CreditPurchaseStatus.PAID,
          providerPaymentId: input.providerPaymentId,
          ...(input.providerCheckoutId
            ? { providerCheckoutId: input.providerCheckoutId }
            : {}),
          completedAt: new Date(),
        },
      });

      if (statusUpdate.count !== 1) {
        const committedPurchase = await tx.creditPurchase.findUniqueOrThrow({
          where: { id: purchase.id },
        });
        if (committedPurchase.status === CreditPurchaseStatus.PAID) {
          return {
            credited: false,
            purchaseId: committedPurchase.id,
            credits: committedPurchase.credits,
            status: committedPurchase.status,
          };
        }
        throw new Error('Purchase could not be finalized');
      }

      await tx.creditBalance.upsert({
        where: { userId: purchase.userId },
        create: {
          userId: purchase.userId,
          balance: purchase.credits,
        },
        update: { balance: { increment: purchase.credits } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: purchase.userId,
          type: TransactionType.PURCHASE,
          amount: purchase.credits,
          description: `Credit purchase: ${purchase.packageId}`,
          purchaseId: purchase.id,
        },
      });

      return {
        credited: true,
        purchaseId: purchase.id,
        credits: purchase.credits,
        status: CreditPurchaseStatus.PAID,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }

  static async markFailed(purchaseId: string) {
    await prisma.creditPurchase.updateMany({
      where: { id: purchaseId, status: CreditPurchaseStatus.PENDING },
      data: { status: CreditPurchaseStatus.FAILED },
    });
  }

  static async markCancelled(purchaseId: string) {
    await prisma.creditPurchase.updateMany({
      where: { id: purchaseId, status: CreditPurchaseStatus.PENDING },
      data: { status: CreditPurchaseStatus.CANCELLED },
    });
  }

  static async listHistory(userId: string) {
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        packageId: true,
        credits: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        completedAt: true,
        providerPaymentId: true,
        providerCheckoutId: true,
      },
    });

    return purchases.map((purchase) => ({
      ...purchase,
      reference: purchase.providerPaymentId ?? purchase.providerCheckoutId,
    }));
  }
}
