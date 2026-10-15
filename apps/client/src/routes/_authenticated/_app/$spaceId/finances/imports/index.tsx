import { importsQueryOptions } from '@kijk/api/imports/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { currentUserQueryOptions } from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Settings } from 'lucide-react';

import { ImportList } from '@/app/imports/import-list';
import { AppError } from '@/shared/components/errors/app-error';
import { PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Import history with entry points for the wizard and space settings. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/imports/')({
  loader: async ({ params: { spaceId }, context: { queryClient } }) => {
    await queryClient.query({ ...importsQueryOptions(spaceId), staleTime: 'static' });
  },
  component: ImportsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  head: () => ({ meta: [{ title: 'Imports' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportsPage() {
  const spaceId = useSpaceId();
  const canImport = useSpacePermission(SpacePermissions.finances.import);
  const { data } = useSuspenseQuery(currentUserQueryOptions());
  const activeSpace = data.user?.spaces?.find((space) => space.id === spaceId);

  return (
    <div className='space-y-6 pt-6'>
      <PageToolbar
        actions={
          <>
            {activeSpace && (
              <Button
                render={<Link to='/settings/spaces/$spaceId/imports' params={{ spaceId: activeSpace.id }} />}
                variant='outline'
                nativeButton={false}
              >
                <Settings /> Household settings
              </Button>
            )}
            {canImport && (
              <Button
                render={<Link params={{ spaceId: spaceId }} to='/$spaceId/finances/imports/new' />}
                nativeButton={false}
              >
                <Plus /> New import
              </Button>
            )}
          </>
        }
      />
      <ImportList />
    </div>
  );
}
