import type { components } from '@/shared/api/generated/kijk';

/** A transaction of the space. */
export type Transaction = components['schemas']['TransactionResponse'];
/** A server-side page of transactions, newest first. */
export type TransactionPage = components['schemas']['TransactionPageResponse'];
/** Whether a transaction is booked or pending. */
export type TransactionStatus = components['schemas']['TransactionStatus'];
/** Payload for recording a transaction. */
export type CreateTransactionRequest = components['schemas']['CreateTransactionRequest'];
/** Payload for updating a transaction. */
export type UpdateTransactionRequest = components['schemas']['UpdateTransactionRequest'];

/** Variables of the update-transaction mutation. */
export interface UpdateTransactionData {
  id: string;
  transaction: UpdateTransactionRequest;
}

/** Filters of the transaction list; omitted values mean all. `month` is 1-12 and requires `year`. */
export interface TransactionFilters {
  /** Only transactions in one of these categories; empty or omitted means all. */
  categoryIds?: string[];
  month?: number;
  uncategorized?: boolean;
  year?: number;
}

/** Filters plus the requested page (1-based); the API clamps a page past the end to the last page. */
export interface TransactionPageQuery extends TransactionFilters {
  page: number;
  pageSize: number;
}

/** Payload for correcting the category of a transaction. */
export type CategorizeTransactionRequest = components['schemas']['CategorizeTransactionRequest'];

/** Variables of the categorize mutation. */
export interface CategorizeTransactionData {
  id: string;
  correction: CategorizeTransactionRequest;
}

/** Payload for assigning one category to several transactions. */
export type CategorizeTransactionsRequest = components['schemas']['CategorizeTransactionsRequest'];
