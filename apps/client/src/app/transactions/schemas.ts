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

/** Validation of the account form. */
export const accountSchema = z.object({
  ibanLast4: z.union([z.literal(''), z.string().regex(/^[0-9A-Za-z]{4}$/, 'Enter the last four characters')]),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

/** Values of the account form. */
export type AccountFormValues = z.infer<typeof accountSchema>;
