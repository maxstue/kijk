import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { signInUser } from '@/shared/api/users';

export const userSignInQuery = queryOptions({
  queryFn: ({ signal }) => signInUser(signal),
  queryKey: ['users', 'sign-in'],
});

export const useSignInUser = () => useSuspenseQuery(userSignInQuery);
