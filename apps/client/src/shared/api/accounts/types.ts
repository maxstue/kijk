import type { components } from '@/shared/api/generated/kijk';

/** A bank account of the space. */
export type Account = components['schemas']['AccountResponse'];
/** Payload for creating an account. */
export type CreateAccountRequest = components['schemas']['CreateAccountRequest'];
/** Payload for updating an account. */
export type UpdateAccountRequest = components['schemas']['UpdateAccountRequest'];
