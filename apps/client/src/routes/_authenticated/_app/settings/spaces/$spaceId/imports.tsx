import * as importsOptions from '@kijk/api/imports/options';
import { createFileRoute } from '@tanstack/react-router';

import { SpaceImportSettings } from '@/app/settings/spaces/imports';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** Import defaults of the household identified by the route. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/imports')({
  component: SpaceImportSettings,
  errorComponent: RouteError,
  loader: ({ context: { queryClient }, params: { spaceId } }) =>
    queryClient.query({ ...importsOptions.settingsQueryOptions(spaceId), staleTime: 'static' }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});
