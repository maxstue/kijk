import { limitsQueryOptions } from '@kijk/api/limits/options';
import { resourcesQueryOptions } from '@kijk/api/resources/options';
import { createFileRoute } from '@tanstack/react-router';

import { LimitsSection } from '@/app/limits/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/consumptions/limits`: consumption limits of the active space. */
export const Route = createFileRoute('/_authenticated/_app/consumptions/limits')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.query({ ...limitsQueryOptions(), staleTime: 'static' }),
      queryClient.query({ ...resourcesQueryOptions(), staleTime: 'static' }),
    ]);
  },
  component: LimitsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  head: () => ({ meta: [{ title: 'Limits' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function LimitsPage() {
  return (
    <div className='space-y-6 pt-6'>
      <LimitsSection />
    </div>
  );
}
