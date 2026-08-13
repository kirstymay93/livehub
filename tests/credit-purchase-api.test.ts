import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';
import { GET, POST } from '@/app/api/credits/purchase/route';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/credit-purchase-service', () => ({
  CreditPurchaseService: {
    createCheckoutSession: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(auth);
const mockedCreateCheckoutSession = vi.mocked(CreditPurchaseService.createCheckoutSession);

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/credits/purchase', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('credit purchase checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue(null as never);
  });

  it('rejects unauthenticated checkout requests', async () => {
    const response = await POST(
      request({ packageId: 'starter' }, { 'Idempotency-Key': 'purchase-key-0000001' })
    );

    expect(response.status).toBe(401);
    expect(mockedCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it('rejects client-supplied price and credit fields', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'viewer-1' } } as never);

    const response = await POST(
      request(
        { packageId: 'starter', amount: 1, credits: 999999, currency: 'usd', recipient: 'attacker' },
        { 'Idempotency-Key': 'purchase-key-0000002' }
      )
    );

    expect(response.status).toBe(400);
    expect(mockedCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it('uses the authenticated user and server-selected package', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'viewer-1' } } as never);
    mockedCreateCheckoutSession.mockResolvedValue({
      purchaseId: 'purchase-1',
      checkoutSessionId: 'cs_test_1',
      checkoutUrl: 'https://checkout.stripe.com/test',
      status: 'PENDING',
    } as never);

    const response = await POST(
      request(
        { packageId: 'starter' },
        { 'Idempotency-Key': 'purchase-key-0000003' }
      )
    );

    expect(response.status).toBe(200);
    expect(mockedCreateCheckoutSession).toHaveBeenCalledWith(
      'viewer-1',
      'starter',
      'purchase-key-0000003'
    );
  });

  it('requires a valid checkout idempotency key', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'viewer-1' } } as never);

    const response = await POST(request({ packageId: 'starter' }));

    expect(response.status).toBe(400);
    expect(mockedCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it('serves the server-defined package catalog', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.packages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'starter', credits: 100, amount: 499, currency: 'usd' }),
      ])
    );
  });
});
