import { apiClient } from '@kijk/api/client';
import { accountsCreate, accountsDelete, accountsList, accountsUpdate } from '@kijk/api/generated/sdk';

import type { CreateAccountRequest, UpdateAccountRequest } from './types';

/** Loads the accounts of the active space. */
export async function list(spaceId: string, signal?: AbortSignal) {
  return accountsList({ client: apiClient(), path: { spaceId }, signal });
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
