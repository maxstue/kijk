import * as resourcesOptions from '@kijk/api/resources/options';
import { Outlet, createFileRoute, stripSearchParams } from '@tanstack/react-router';

import { resourceSort } from '@/app/resources/columns';
import { ResourceTypesSection } from '@/app/resources/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { tableSearchDefaults, tableSearchSchema, toTableQuery } from '@/shared/lib/table-query';

/** `/consumptions/resources`: resources of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/resources')({
  // The statistics count every resource; the table shows its first page.
  validateSearch: tableSearchSchema,
  search: { middlewares: [stripSearchParams(tableSearchDefaults(resourceSort))] },
  loaderDeps: ({ search }) => search,
  loader: async ({ params: { spaceId }, context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({ ...resourcesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
      queryClient.query({
        ...resourcesOptions.listQueryOptions(spaceId, toTableQuery(resourceSort, deps)),
        staleTime: 'static',
      }),
    ]);
  },
  component: ResourcesPage,
  errorComponent: RouteError,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  head: () => ({ meta: [{ title: 'Resources' }] }),
});

function ResourcesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div data-guide='resources' className='space-y-6 pt-6'>
      <ResourceTypesSection
        search={search}
        onSearchChange={(change, options) =>
          void navigate({ search: (previous) => ({ ...previous, ...change }), replace: options?.replace })
        }
      />
      <Outlet />
    </div>
  );
}
