import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions, type Query } from '@tanstack/react-query';

import { getCurrentUser, requestAccountDeletion, switchSpace, updateUser, welcomeUser } from './requests';

/** Query for the current account state. */
export const currentUserQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCurrentUser(signal),
    queryKey: queryKeys.users.me,
  });

/** Mutation that updates the user's settings. */
export const updateUserMutationOptions = () =>
  mutationOptions({
    mutationFn: updateUser,
    // Resources show values in the user's preferred units.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.users.me, queryKeys.resources.all),
  });

/** Mutation that completes onboarding. */
export const welcomeUserMutationOptions = () =>
  mutationOptions({
    mutationFn: welcomeUser,
    onSuccess: (data, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, data);
    },
  });

/** Mutation that switches the active space. */
export const switchSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: switchSpace,
    onSuccess: async (currentUser, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, currentUser);
      // Every other query belongs to the previous space: unused ones are dropped, visible ones keep their data until
      // the new space's data replaces it.
      const predicate = (query: Query) => query.queryKey[0] !== queryKeys.users.me[0];
      client.removeQueries({ predicate, type: 'inactive' });
      await client.invalidateQueries({ predicate });
    },
  });

/** Mutation that starts deleting the current user's account and all their data. */
export const requestAccountDeletionMutationOptions = () =>
  mutationOptions({
    mutationFn: requestAccountDeletion,
  });
