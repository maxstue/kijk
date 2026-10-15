import { resourcesQueryOptions } from '@kijk/api/resources/options';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ResourceTypesSection } from '@/app/resources/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/consumptions/resources`: resources of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/resources')({
  loader: ({ context: { queryClient } }) => queryClient.query({ ...resourcesQueryOptions(), staleTime: 'static' }),
  component: ResourcesPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  head: () => ({ meta: [{ title: 'Resources' }] }),
});

function ResourcesPage() {
  return (
    <div className='space-y-6 pt-6'>
      <ResourceTypesSection />
      <Outlet />
    </div>
  );
}
