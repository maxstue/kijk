import * as limitsOptions from '@kijk/api/limits/options';
import * as resourcesOptions from '@kijk/api/resources/options';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { periods } from '@/app/limits/schemas';
import { LimitsSection } from '@/app/limits/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { listSearchSchema } from '@/shared/lib/list-search';

/** `/consumptions/limits`: consumption limits of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/limits')({
  validateSearch: listSearchSchema.extend({
    view: z.enum(['list', 'cards']).default('list').catch('list'),
    resourceId: z.uuid().optional().catch(undefined),
    period: z.enum(periods).optional().catch(undefined),
    sort: z.enum(['Resource', 'Name', 'Period']).default('Resource').catch('Resource'),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params: { spaceId }, context: { queryClient }, deps: { view: _view, ...query } }) => {
    await Promise.all([
      queryClient.query({
        ...limitsOptions.listQueryOptions(spaceId, { ...query, pageSize: 10 }),
        staleTime: 'static',
      }),
      queryClient.query({ ...resourcesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
    ]);
  },
  component: LimitsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Limits' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function LimitsPage() {
  const { view, ...query } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div data-guide='limits' className='pt-6'>
      <LimitsSection
        view={view}
        query={{ ...query, pageSize: 10 }}
        onQueryChange={(next) => void navigate({ search: { ...next, view }, replace: next.search !== query.search })}
        onViewChange={(nextView) => void navigate({ search: (previous) => ({ ...previous, view: nextView }) })}
      />
    </div>
  );
}
