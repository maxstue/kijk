import { createFileRoute } from '@tanstack/react-router';

import { SpaceImportSettings } from '@/app/settings/spaces/imports';
import { importSettingsQueryOptions } from '@/shared/api/imports/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** Import defaults of the household identified by the route. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/imports')({
  component: SpaceImportSettings,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: ({ context: { queryClient }, params: { spaceId } }) =>
    queryClient.ensureQueryData(importSettingsQueryOptions(spaceId)),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});
