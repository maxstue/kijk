import { categoriesQueryOptions } from '@kijk/api/categories/options';
import { importQueryOptions } from '@kijk/api/imports/options';
import { createFileRoute } from '@tanstack/react-router';

import { ImportDetail } from '@/app/imports/import-detail';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/finances/imports/$importId`: the steps of one import, from column mapping to review. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/imports/$importId')({
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.query({ ...importQueryOptions(params.spaceId, params.importId), staleTime: 'static' }),
      queryClient.query({ ...categoriesQueryOptions(params.spaceId), staleTime: 'static' }),
    ]);
  },
  component: ImportPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  head: () => ({ meta: [{ title: 'Import' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportPage() {
  const { importId } = Route.useParams();

  return <ImportDetail key={importId} importId={importId} />;
}
