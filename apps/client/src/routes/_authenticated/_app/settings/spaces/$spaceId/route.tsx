import * as usersOptions from '@kijk/api/users/options';
import { Outlet, createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { SpaceSettingsContext } from '@/app/settings/spaces/context';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/settings/spaces/$spaceId`: loads the space and provides it to its settings pages. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId')({
  component: SpaceSettingsPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient }, params: { spaceId } }) => {
    const account = await queryClient.query({ ...usersOptions.meQueryOptions(), staleTime: 'static' });
    const user = account.user;
    const space = user?.spaces?.find((entry) => entry.id === spaceId);
    if (!user || !space) {
      throw notFound();
    }
    return { space, user };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.space.name ?? 'Space settings' }] }),
  notFoundComponent: () => <p className='text-muted-foreground'>This space is not available to your account.</p>,
  parseParams: (parameters) => ({ spaceId: z.uuid().parse(parameters.spaceId) }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function SpaceSettingsPage() {
  const value = Route.useLoaderData();

  return (
    <SpaceSettingsContext value={value}>
      <Outlet />
    </SpaceSettingsContext>
  );
}
