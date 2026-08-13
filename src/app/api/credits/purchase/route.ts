import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCreditPackage, listCreditPackages } from '@/lib/credits/packages';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';
import { creditPurchaseRequestSchema, idempotencyKeySchema } from '@/lib/validators';

export async function GET() {
  return NextResponse.json({ packages: listCreditPackages() });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = idempotencyKeySchema.safeParse(request.headers.get('Idempotency-Key'));
    if (!requestId.success) {
      return NextResponse.json(
        { error: requestId.error.issues[0]?.message ?? 'Idempotency-Key header is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = creditPurchaseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Only a valid server-defined packageId may be submitted' },
        { status: 400 }
      );
    }

    const creditPackage = getCreditPackage(parsed.data.packageId);
    const result = await CreditPurchaseService.createCheckoutSession(
      session.user.id,
      creditPackage.id,
      requestId.data
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating credit checkout:', error);
    const message = error instanceof Error ? error.message : '';
    const knownErrors = new Set([
      'Credit package not found',
      'Idempotency key belongs to another user',
      'Idempotency key was already used for another package',
      'Checkout is still being prepared; retry with a new request',
      'Stripe is not configured',
      'Application URL is not configured',
    ]);
    if (knownErrors.has(message)) {
      const status = message === 'Credit package not found' ? 400 : 409;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}
