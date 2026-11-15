import * as categoriesOptions from '@kijk/api/categories/options';
import * as importsOptions from '@kijk/api/imports/options';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ImportDetail } from '@/app/imports/import-detail';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { listSearchSchema } from '@/shared/lib/list-search';

/** `/finances/imports/$importId`: the steps of one import, from column mapping to review. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/imports/$importId')({
  validateSearch: listSearchSchema.extend({
    reviewStage: z.enum(['months', 'review']).default('months').catch('months'),
    adjustmentsOpen: z.boolean().default(false).catch(false),
    cardPage: z.coerce.number().int().min(1).max(2147483647).default(1).catch(1),
    cardOpen: z.boolean().default(false).catch(false),
    filter: z.enum(['Uncategorized', 'Errors', 'Excluded']).optional().catch(undefined),
  }),
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.query({
        ...importsOptions.detailsQueryOptions(params.spaceId, params.importId),
        staleTime: 'static',
      }),
      queryClient.query({
        ...categoriesOptions.listQueryOptions(params.spaceId),
        staleTime: 'static',
      }),
    ]);
  },
  component: ImportPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Import' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportPage() {
  const { importId } = Route.useParams();
  const query = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ImportDetail
      query={query}
      onQueryChange={(next) => void navigate({ search: { ...query, ...next }, replace: next.search !== query.search })}
      key={importId}
      importId={importId}
    />
  );
}
