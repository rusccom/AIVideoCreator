CREATE UNIQUE INDEX "CreditLedger_refund_generationJobId_idx"
ON "CreditLedger"("generationJobId")
WHERE "type" = 'refund' AND "generationJobId" IS NOT NULL;
