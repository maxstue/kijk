import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { getCurrentUser, updateUser, welcomeUser } from './requests';

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
  });

/** Mutation that completes onboarding. */
export const welcomeUserMutationOptions = () =>
  mutationOptions({
    mutationFn: welcomeUser,
  });
