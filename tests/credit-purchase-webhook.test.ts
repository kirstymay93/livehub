import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/webhook/route';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';

vi.mock('@/lib/services/credit-purchase-service', () => ({
  CreditPurchaseService: {
    fulfillCheckoutSession: vi.fn(),
    fulfillPaymentIntent: vi.fn(),
    markFailed: vi.fn(),
    markCancelled: vi.fn(),
  },
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
  getStripeWebhookSecret: vi.fn(),
}));

const mockedService = vi.mocked(CreditPurchaseService);
const mockedGetStripe = vi.mocked(getStripe);
const mockedGetStripeWebhookSecret = vi.mocked(getStripeWebhookSecret);

function request(signature?: string) {
  return new NextRequest('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    body: JSON.stringify({ id: 'evt_test_1', type: 'checkout.session.completed' }),
  });
}

describe('Stripe payment webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetStripeWebhookSecret.mockReturnValue('whsec_test');
  });

  it('rejects requests without a Stripe signature', async () => {
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(mockedService.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures before processing payment data', async () => {
    const constructEvent = vi.fn(() => {
      throw new Error('invalid signature');
    });
    mockedGetStripe.mockReturnValue({
      webhooks: { constructEvent },
    } as never);

    const response = await POST(request('t=1,v1=invalid'));

    expect(response.status).toBe(400);
    expect(constructEvent).toHaveBeenCalledWith(
      expect.any(String),
      't=1,v1=invalid',
      'whsec_test'
    );
    expect(mockedService.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it('processes a verified checkout completion and acknowledges it', async () => {
    const event = {
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', mode: 'payment', payment_status: 'paid' } },
    };
    mockedGetStripe.mockReturnValue({
      webhooks: { constructEvent: vi.fn(() => event) },
    } as never);

    const response = await POST(request('t=1,v1=valid'));

    expect(response.status).toBe(200);
    expect(mockedService.fulfillCheckoutSession).toHaveBeenCalledWith(event.data.object);
  });

  it('returns a retryable failure when verified payment processing fails', async () => {
    mockedGetStripe.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          id: 'evt_test_1',
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test_1', status: 'succeeded' } },
        })),
      },
    } as never);
    mockedService.fulfillPaymentIntent.mockRejectedValue(new Error('database unavailable'));

    const response = await POST(request('t=1,v1=valid'));

    expect(response.status).toBe(500);
    expect(mockedService.fulfillPaymentIntent).toHaveBeenCalled();
  });
});
