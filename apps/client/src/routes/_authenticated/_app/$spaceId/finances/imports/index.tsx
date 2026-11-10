import * as importsOptions from '@kijk/api/imports/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Settings } from 'lucide-react';

import { ImportList } from '@/app/imports/import-list';
import { RouteError } from '@/shared/components/errors/route-error';
import { PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Import history with entry points for the wizard and space settings. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/imports/')({
  loader: async ({ params: { spaceId }, context: { queryClient } }) => {
    await queryClient.query({ ...importsOptions.listQueryOptions(spaceId), staleTime: 'static' });
  },
  component: ImportsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Imports' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportsPage() {
  const spaceId = useSpaceId();
  const canImport = useSpacePermission(SpacePermissions.finances.import);
  const { data } = useSuspenseQuery(usersOptions.meQueryOptions());
  const activeSpace = data.user?.spaces?.find((space) => space.id === spaceId);

  return (
    <div data-guide='imports' className='space-y-6 pt-6'>
      <PageToolbar>
        <PageToolbarActions>
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
        </PageToolbarActions>
      </PageToolbar>
      <ImportList />
    </div>
  );
}
