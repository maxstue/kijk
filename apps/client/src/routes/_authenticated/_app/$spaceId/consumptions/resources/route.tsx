import * as resourcesOptions from '@kijk/api/resources/options';
import { useQuery } from '@tanstack/react-query';
import { Outlet, Link, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ResourceTypesSection } from '@/app/resources/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/consumptions/resources`: resources of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/resources')({
  validateSearch: z.object({ guideReturn: z.enum(['record', 'limit']).optional().catch(undefined) }),
  loader: ({ params: { spaceId }, context: { queryClient } }) =>
    queryClient.query({ ...resourcesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
  component: ResourcesPage,
  errorComponent: RouteError,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  head: () => ({ meta: [{ title: 'Resources' }] }),
});

function ResourcesPage() {
  const { spaceId } = Route.useParams();
  const { guideReturn } = Route.useSearch();
  const resources = useQuery(resourcesOptions.listQueryOptions(spaceId));
  return (
    <div data-guide='resources' className='space-y-6 pt-6'>
      {guideReturn && (
        <div className='space-y-2 rounded-lg border p-4'>
          <p>Configure a resource to continue your checklist.</p>
          {guideReturn === 'record' && resources.isSuccess && resources.data.length > 0 && (
            <Link to='/$spaceId/consumptions' params={{ spaceId }} search={{ create: true }}>
              Continue to record a value
            </Link>
          )}
          {guideReturn === 'limit' && resources.isSuccess && resources.data.length > 0 && (
            <Link to='/$spaceId/consumptions/limits' params={{ spaceId }}>
              Continue to create a limit
            </Link>
          )}
          <Link to='/$spaceId' params={{ spaceId }} className='block'>
            Back to checklist
          </Link>
        </div>
      )}
      <ResourceTypesSection />
      <Outlet />
    </div>
  );
}
