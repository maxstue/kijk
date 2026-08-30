import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { getCurrentUser, updateUser, welcomeUser } from './requests';

export const currentUserQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => getCurrentUser(signal),
    queryKey: queryKeys.users.me,
  });

export const updateUserMutationOptions = () =>
  mutationOptions({
    mutationFn: updateUser,
  });

export const welcomeUserMutationOptions = () =>
  mutationOptions({
    mutationFn: welcomeUser,
  });
