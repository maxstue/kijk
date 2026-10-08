import { z } from 'zod';

/** Select value for "no account" or "no category"; select items cannot use an empty string. */
export const noneValue = 'none';

/** Validation of the transaction form. The sign of the amount comes from `direction`. */
export const transactionSchema = z.object({
  accountId: z.string(),
  amount: z.number().positive('Amount must be greater than zero'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  categoryId: z.string(),
  counterparty: z.string().trim().max(200, 'Counterparty must be at most 200 characters'),
  direction: z.enum(['expense', 'income']),
  isTransfer: z.boolean(),
  pending: z.boolean(),
  purpose: z.string().trim().max(500, 'Purpose must be at most 500 characters'),
});

/** Values of the transaction form. */
export type TransactionFormValues = z.infer<typeof transactionSchema>;
