import { apiClient } from '@kijk/api/client';
import { accountsCreate, accountsDelete, accountsList, accountsUpdate } from '@kijk/api/generated/sdk';
import type { ListQuery } from '@kijk/api/paging';

import type { AccountSort, CreateAccountRequest, UpdateAccountRequest } from './types';

/** Loads the accounts, optionally searched, sorted and paged. */
export async function list(spaceId: string, query: ListQuery<AccountSort> = {}, signal?: AbortSignal) {
  return accountsList({ client: apiClient(), path: { spaceId }, query, signal });
}

/** Creates an account. */
export async function create(spaceId: string, data: CreateAccountRequest, signal?: AbortSignal) {
  return accountsCreate({ client: apiClient(), path: { spaceId }, body: data, signal });
}

/** Updates an account. */
export async function update(spaceId: string, id: string, data: UpdateAccountRequest, signal?: AbortSignal) {
  return accountsUpdate({ client: apiClient(), body: data, path: { spaceId, id }, signal });
}

/** Deletes an account without transactions. */
export async function remove(spaceId: string, id: string, signal?: AbortSignal) {
  await accountsDelete({ client: apiClient(), path: { spaceId, id }, signal });
}
