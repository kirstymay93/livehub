'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, History, WalletCards } from 'lucide-react';

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  amount: number;
  currency: string;
};

type Purchase = {
  packageId: string;
  credits: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  reference: string | null;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function WalletPage() {
  const { status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isReady = useMemo(() => status === 'authenticated', [status]);

  useEffect(() => {
    if (!isReady) return;

    const loadWallet = async () => {
      try {
        const [balanceResponse, packageResponse, purchaseResponse] = await Promise.all([
          fetch('/api/credits'),
          fetch('/api/credits/purchase'),
          fetch('/api/credits/purchases'),
        ]);
        if (!balanceResponse.ok || !packageResponse.ok || !purchaseResponse.ok) {
          throw new Error('Unable to load wallet');
        }
        const balanceData = await balanceResponse.json();
        const packageData = await packageResponse.json();
        const purchaseData = await purchaseResponse.json();
        setBalance(balanceData.balance);
        setPackages(packageData.packages);
        setPurchases(purchaseData.purchases);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load wallet');
      } finally {
        setLoading(false);
      }
    };

    void loadWallet();
  }, [isReady]);

  const startPurchase = async (packageId: string) => {
    setBuyingPackageId(packageId);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ packageId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start checkout');
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setMessage('This purchase is already complete. Your wallet will refresh shortly.');
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : 'Unable to start checkout');
    } finally {
      setBuyingPackageId(null);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-gray-300">Loading wallet…</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">Sign in to view your wallet</h1>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-livehub-accent px-5 py-3 font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-livehub-accent">Wallet</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Your LiveHub credits</h1>
        <p className="mt-2 text-gray-400">Purchase credits securely, then use them to support creators in live rooms.</p>
      </div>

      {message && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-2xl border border-livehub-border bg-livehub-card p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <WalletCards className="h-6 w-6 text-livehub-accent" />
          <div>
            <p className="text-sm text-gray-400">Current credits</p>
            <p className="text-4xl font-bold text-white">{balance?.toLocaleString() ?? '—'}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-livehub-accent" />
          <h2 className="text-xl font-semibold text-white">Purchase credits</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((creditPackage) => (
            <article key={creditPackage.id} className="rounded-2xl border border-livehub-border bg-livehub-card p-5">
              <p className="text-sm text-gray-400">{creditPackage.name}</p>
              <p className="mt-2 text-2xl font-bold text-white">{creditPackage.credits.toLocaleString()}</p>
              <p className="text-sm text-gray-400">credits</p>
              <button
                type="button"
                onClick={() => void startPurchase(creditPackage.id)}
                disabled={buyingPackageId !== null}
                className="mt-5 w-full rounded-lg bg-livehub-accent px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buyingPackageId === creditPackage.id ? 'Opening checkout…' : formatMoney(creditPackage.amount, creditPackage.currency)}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <History className="h-5 w-5 text-livehub-accent" />
          <h2 className="text-xl font-semibold text-white">Purchase history</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-livehub-border bg-livehub-card">
          {purchases.length === 0 ? (
            <p className="p-6 text-gray-400">No purchases yet.</p>
          ) : (
            <div className="divide-y divide-livehub-border">
              {purchases.map((purchase, index) => (
                <div key={`${purchase.reference ?? purchase.packageId}-${index}`} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-white">{purchase.credits.toLocaleString()} credits</p>
                    <p className="text-sm text-gray-400">{new Date(purchase.createdAt).toLocaleString()}</p>
                    {purchase.reference && <p className="mt-1 break-all text-xs text-gray-500">Reference: {purchase.reference}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-white">{formatMoney(purchase.amount, purchase.currency)}</p>
                    <p className="text-sm text-gray-400">{purchase.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
