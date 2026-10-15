import { invalidate, invalidateInEverySpace } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { getCurrentUser, requestAccountDeletion, setDefaultSpace, updateUser, welcomeUser } from './requests';

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
    // Resources of every space show values in the user's preferred units.
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.users.me), invalidateInEverySpace(client, 'resources')]),
  });

/** Mutation that completes onboarding. */
export const welcomeUserMutationOptions = () =>
  mutationOptions({
    mutationFn: welcomeUser,
    onSuccess: (data, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, data);
    },
  });

/** Mutation that sets or clears the space the app opens first. */
export const setDefaultSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: setDefaultSpace,
    onSuccess: (currentUser, _variables, _result, { client }) => {
      client.setQueryData(queryKeys.users.me, currentUser);
    },
  });

/** Mutation that starts deleting the current user's account and all their data. */
export const requestAccountDeletionMutationOptions = () =>
  mutationOptions({
    mutationFn: requestAccountDeletion,
  });
