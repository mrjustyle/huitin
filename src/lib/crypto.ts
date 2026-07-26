import { createHash } from 'crypto';

/**
 * Generate a SHA-256 checksum for a receipt.
 * Ensures data integrity (cannot be forged without the secret key).
 */
export function generateReceiptChecksum(
  groupId: string,
  periodId: string,
  memberId: string,
  amount: number,
  transactionType: 'contribution' | 'payout',
  referenceId: string
): string {
  // Use a secret key from env, fallback to a default if missing during dev
  const secret = process.env.RECEIPT_SECRET_KEY || 'huitin-secret-key-2026';
  
  const payload = [
    groupId,
    periodId,
    memberId,
    amount.toString(),
    transactionType,
    referenceId,
    secret
  ].join('|');
  
  return createHash('sha256').update(payload).digest('hex').substring(0, 16);
}
