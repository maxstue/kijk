import { createFileRoute } from '@tanstack/react-router';

import { ImportDetail } from '@/app/imports/import-detail';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { importQueryOptions } from '@/shared/api/imports/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** `/finances/imports/$importId`: the steps of one import, from column mapping to review. */
export const Route = createFileRoute('/_authenticated/_app/finances/imports/$importId')({
  component: ImportPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.query({ ...importQueryOptions(params.importId), staleTime: 'static' }),
      queryClient.query({ ...categoriesQueryOptions(), staleTime: 'static' }),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ImportPage() {
  useSetSiteHeader('Import');
  const { importId } = Route.useParams();

  return <ImportDetail key={importId} importId={importId} />;
}
