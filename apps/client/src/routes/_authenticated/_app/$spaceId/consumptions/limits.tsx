import * as limitsOptions from '@kijk/api/limits/options';
import * as resourcesOptions from '@kijk/api/resources/options';
import { createFileRoute } from '@tanstack/react-router';

import { LimitsSection } from '@/app/limits/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/consumptions/limits`: consumption limits of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/limits')({
  loader: async ({ params: { spaceId }, context: { queryClient } }) => {
    await Promise.all([
      queryClient.query({ ...limitsOptions.listQueryOptions(spaceId), staleTime: 'static' }),
      queryClient.query({ ...resourcesOptions.listQueryOptions(spaceId), staleTime: 'static' }),
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
