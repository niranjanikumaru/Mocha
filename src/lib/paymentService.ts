import { PaymentWebhookPayload, UserAccountBalance } from '../types/trading';

// In-memory idempotency store — replace with a DB in production
const processedPayments = new Map<string, { processedAt: number; amountUsd: number }>();

export function processPaymentWebhook(
  payload: PaymentWebhookPayload,
  account: UserAccountBalance
): { credited: boolean; deduped: boolean; message: string; balance: UserAccountBalance } {
  const { idempotencyKey, amountUsd, paymentId, bankRef } = payload;

  // Check idempotency — never credit twice for the same key
  if (processedPayments.has(idempotencyKey)) {
    const existing = processedPayments.get(idempotencyKey)!;
    return {
      credited: false,
      deduped: true,
      message: `Duplicate payment notification ignored. Payment ${paymentId} with key ${idempotencyKey} was already processed at ${new Date(existing.processedAt).toISOString()}. Balance unchanged.`,
      balance: account,
    };
  }

  // First-time processing
  processedPayments.set(idempotencyKey, { processedAt: Date.now(), amountUsd });

  const updatedBalance: UserAccountBalance = {
    ...account,
    availableUsd: account.availableUsd + amountUsd,
    totalEquityUsd: account.totalEquityUsd + amountUsd,
    depositProcessedKeys: [...account.depositProcessedKeys, idempotencyKey],
  };

  return {
    credited: true,
    deduped: false,
    message: `Payment credited: $${amountUsd.toFixed(2)} USD (Bank Ref: ${bankRef}). New available balance: $${updatedBalance.availableUsd.toFixed(2)}.`,
    balance: updatedBalance,
  };
}

export function getProcessedPaymentCount(): number {
  return processedPayments.size;
}

export function resetPaymentService() {
  processedPayments.clear();
}
