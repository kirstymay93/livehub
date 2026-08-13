export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  amount: number;
  currency: 'usd';
};

const CREDIT_PACKAGES: readonly CreditPackage[] = [
  { id: 'starter', name: 'Starter', credits: 100, amount: 499, currency: 'usd' },
  { id: 'supporter', name: 'Supporter', credits: 500, amount: 1999, currency: 'usd' },
  { id: 'creator', name: 'Creator', credits: 1000, amount: 3499, currency: 'usd' },
  { id: 'community', name: 'Community', credits: 5000, amount: 14999, currency: 'usd' },
];

export function listCreditPackages(): CreditPackage[] {
  return CREDIT_PACKAGES.map((creditPackage) => ({ ...creditPackage }));
}

export function getCreditPackage(packageId: string): CreditPackage {
  const creditPackage = CREDIT_PACKAGES.find((item) => item.id === packageId);
  if (!creditPackage) {
    throw new Error('Credit package not found');
  }
  return creditPackage;
}
