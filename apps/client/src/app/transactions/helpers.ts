import { noneValue } from '@/app/transactions/schemas';
import type { TransactionFormValues } from '@/app/transactions/schemas';
import type { CreateTransactionRequest, Transaction } from '@/shared/api/transactions/types';

/** Returns today's date as `YYYY-MM-DD` in local time. */
export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Default values of the form for a new transaction. */
export function getCreateDefaultValues(): TransactionFormValues {
  return {
    accountId: noneValue,
    amount: 0,
    bookingDate: today(),
    categoryId: noneValue,
    counterparty: '',
    direction: 'expense',
    isTransfer: false,
    pending: false,
    purpose: '',
  };
}

/** Form values of an existing transaction. */
export function toFormValues(transaction: Transaction): TransactionFormValues {
  const amount = Number(transaction.amount);
  return {
    accountId: transaction.accountId ?? noneValue,
    amount: Math.abs(amount),
    bookingDate: transaction.bookingDate,
    categoryId: transaction.categoryId ?? noneValue,
    counterparty: transaction.counterparty ?? '',
    direction: amount < 0 ? 'expense' : 'income',
    isTransfer: transaction.isTransfer,
    pending: transaction.status === 'Pending',
    purpose: transaction.purpose ?? '',
  };
}

/** Request payload of the form values; expenses are sent as negative amounts. */
export function toRequest(values: TransactionFormValues): CreateTransactionRequest {
  return {
    accountId: values.accountId === noneValue ? null : values.accountId,
    amount: values.direction === 'expense' ? -values.amount : values.amount,
    bookingDate: values.bookingDate,
    categoryId: values.categoryId === noneValue ? null : values.categoryId,
    counterparty: values.counterparty || null,
    isTransfer: values.isTransfer,
    purpose: values.purpose || null,
    status: values.pending ? 'Pending' : 'Booked',
  };
}

/** Request payload that only changes the category of a transaction and keeps everything else. */
export function withCategory(transaction: Transaction, categoryId: string | null): CreateTransactionRequest {
  return {
    accountId: transaction.accountId ?? null,
    amount: transaction.amount,
    bookingDate: transaction.bookingDate,
    categoryId,
    counterparty: transaction.counterparty ?? null,
    isTransfer: transaction.isTransfer,
    purpose: transaction.purpose ?? null,
    status: transaction.status,
  };
}
