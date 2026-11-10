import * as resourcesOptions from '@kijk/api/resources/options';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ResourceTypesSection } from '@/app/resources/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/consumptions/resources`: resources of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/resources')({
  loader: ({ params: { spaceId }, context: { queryClient } }) =>
    queryClient.query({ ...resourcesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
  component: ResourcesPage,
  errorComponent: RouteError,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  head: () => ({ meta: [{ title: 'Resources' }] }),
});

function ResourcesPage() {
  return (
    <div data-guide='resources' className='space-y-6 pt-6'>
      <ResourceTypesSection />
      <Outlet />
    </div>
  );
}
