import { createFileRoute } from '@tanstack/react-router';

import { SpaceBackLink } from '@/app/settings/spaces/back-link';
import { useSpaceSettings } from '@/app/settings/spaces/context';
import { UnitsSection } from '@/app/settings/units/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** `/settings/spaces/$spaceId/units`: units of the space. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/units')({
  component: SpaceUnitsPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function SpaceUnitsPage() {
  const { space } = useSpaceSettings();
  useSetSiteHeader('Space units');
  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <UnitsSection spaceId={space.id} key={space.id} scope='space' />
    </div>
  );
}
