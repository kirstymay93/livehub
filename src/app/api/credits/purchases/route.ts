import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CreditPurchaseService } from '@/lib/services/credit-purchase-service';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchases = await CreditPurchaseService.listHistory(session.user.id);
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching credit purchases:', error);
    return NextResponse.json({ error: 'Unable to fetch purchase history' }, { status: 500 });
  }
}
