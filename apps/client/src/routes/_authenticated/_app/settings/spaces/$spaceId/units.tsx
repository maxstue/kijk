import { createFileRoute } from '@tanstack/react-router';

import { SpaceBackLink } from '@/app/settings/spaces/back-link';
import { useSpaceSettings } from '@/app/settings/spaces/context';
import { UnitsSection } from '@/app/settings/units/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/settings/spaces/$spaceId/units`: units of the space. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/units')({
  head: () => ({ meta: [{ title: 'Space units' }] }),
  component: SpaceUnitsPage,
  errorComponent: RouteError,
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function SpaceUnitsPage() {
  const { space } = useSpaceSettings();
  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <UnitsSection spaceId={space.id} key={space.id} scope='space' />
    </div>
  );
}
