import { currentUserQueryOptions } from '@kijk/api/users/options';
import { isReadyCurrentUser } from '@kijk/api/users/types';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { getStartSpace } from '@/shared/lib/spaces';

/** `/home`: opens the default space, otherwise the space used last on this device. */
export const Route = createFileRoute('/_authenticated/_app/home')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const currentUser = await queryClient.query({ ...currentUserQueryOptions(), staleTime: 'static' });
    const space = isReadyCurrentUser(currentUser) ? getStartSpace(currentUser.user) : undefined;
    throw space
      ? redirect({ params: { spaceId: space.id }, replace: true, to: '/$spaceId' })
      : redirect({ replace: true, to: '/welcome' });
  },
});
