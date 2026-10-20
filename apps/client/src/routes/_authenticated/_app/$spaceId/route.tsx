import * as usersOptions from '@kijk/api/users/options';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { rememberLastSpace } from '@/shared/lib/spaces';

/** `/$spaceId`: everything that belongs to one space; unknown spaces lead back to the start space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId')({
  beforeLoad: async ({ context: { queryClient }, params: { spaceId } }) => {
    const currentUser = await queryClient.query({ ...usersOptions.meQueryOptions(), staleTime: 'static' });
    const space = currentUser.user?.spaces?.find((entry) => entry.id === spaceId);
    if (!space) {
      throw redirect({ replace: true, to: '/' });
    }

    rememberLastSpace(currentUser.user!.id, space.id);
    return { space };
  },
  component: SpaceLayout,
});

function SpaceLayout() {
  const { spaceId } = Route.useParams();
  return <Outlet key={spaceId} />;
}
