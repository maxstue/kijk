import type * as Api from '@kijk/api/generated/types';

/** A bank account of the space. */
export type Account = Api.AccountResponse;
/** Payload for creating an account. */
export type CreateAccountRequest = Api.CreateAccountRequest;
/** Payload for updating an account. */
export type UpdateAccountRequest = Api.UpdateAccountRequest;

/** Accounts of the active space; one page of them when the query names a page. */
export type AccountPage = Api.PageResponseOfAccountResponse;
/** The columns the account list can be sorted by. */
export type AccountSort = Api.AccountSort;
