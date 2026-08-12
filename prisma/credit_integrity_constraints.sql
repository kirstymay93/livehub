DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_balance_nonnegative'
  ) THEN
    ALTER TABLE "CreditBalance"
      ADD CONSTRAINT "credit_balance_nonnegative" CHECK ("balance" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_transaction_amount_positive'
  ) THEN
    ALTER TABLE "CreditTransaction"
      ADD CONSTRAINT "credit_transaction_amount_positive" CHECK ("amount" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_transfer_amount_positive'
  ) THEN
    ALTER TABLE "CreditTransfer"
      ADD CONSTRAINT "credit_transfer_amount_positive" CHECK ("amount" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_transfer_not_self'
  ) THEN
    ALTER TABLE "CreditTransfer"
      ADD CONSTRAINT "credit_transfer_not_self" CHECK ("senderId" <> "creatorId");
  END IF;
END $$;
