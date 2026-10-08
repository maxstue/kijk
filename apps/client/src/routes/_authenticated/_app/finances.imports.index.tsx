import { Button } from '@kijk/ui/components/button';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Settings } from 'lucide-react';

import { ImportList } from '@/app/imports/import-list';
import { importsQueryOptions } from '@/shared/api/imports/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { AppError } from '@/shared/components/errors/app-error';
import { PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Import history with entry points for the wizard and space settings. */
export const Route = createFileRoute('/_authenticated/_app/finances/imports/')({
  component: ImportsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(importsQueryOptions());
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportsPage() {
  useSetSiteHeader('Imports');
  const canImport = useSpacePermission(SpacePermissions.finances.import);
  const { data } = useSuspenseQuery(currentUserQueryOptions());
  const activeSpace = data.user?.spaces?.find((space) => space.isActive);

  return (
    <div className='space-y-6 pt-6'>
      <PageToolbar
        actions={
          <>
            {activeSpace && (
              <Button asChild variant='outline'>
                <Link to='/settings/spaces/$spaceId/imports' params={{ spaceId: activeSpace.id }}>
                  <Settings /> Household settings
                </Link>
              </Button>
            )}
            {canImport && (
              <Button asChild>
                <Link to='/finances/imports/new'>
                  <Plus /> New import
                </Link>
              </Button>
            )}
          </>
        }
      />
      <ImportList />
    </div>
  );
}
