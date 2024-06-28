import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { signInUser } from '@/shared/api/users';

export const userSignInQuery = queryOptions({
  queryKey: ['users', 'sign-in'],
  queryFn: ({ signal }) => signInUser(signal),
});

export const useSignInUser = () => useSuspenseQuery(userSignInQuery);
