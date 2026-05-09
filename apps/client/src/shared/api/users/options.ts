import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import { signInUser, updateUser, welcomeUser } from './requests';

export const signedInUserQueryOptions = () =>
  queryOptions({
    queryFn: ({ signal }) => signInUser(signal),
    queryKey: queryKeys.users.current,
  });

export const updateUserMutationOptions = () =>
  mutationOptions({
    mutationFn: updateUser,
  });

export const welcomeUserMutationOptions = () =>
  mutationOptions({
    mutationFn: welcomeUser,
  });
