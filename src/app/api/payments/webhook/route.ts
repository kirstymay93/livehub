import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';

export const runtime = 'nodejs';

function getMetadataPurchaseId(object: { metadata?: Stripe.Metadata | null }) {
  return object.metadata?.purchaseId;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await CreditPurchaseService.fulfillCheckoutSession(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'payment_intent.succeeded':
        await CreditPurchaseService.fulfillPaymentIntent(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = getMetadataPurchaseId(session);
        if (purchaseId) await CreditPurchaseService.markFailed(purchaseId);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = getMetadataPurchaseId(session);
        if (purchaseId) await CreditPurchaseService.markCancelled(purchaseId);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const purchaseId = getMetadataPurchaseId(paymentIntent);
        if (purchaseId) await CreditPurchaseService.markFailed(purchaseId);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
