import { createFileRoute } from '@tanstack/react-router';

import { LimitsSection } from '@/app/limits/section';
import { limitsQueryOptions } from '@/shared/api/limits/options';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** `/limits`: consumption limits of the active space. */
export const Route = createFileRoute('/_authenticated/_app/limits')({
  component: LimitsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(limitsQueryOptions()),
      queryClient.ensureQueryData(resourcesQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function LimitsPage() {
  useSetSiteHeader('Limits');

  return (
    <div className='space-y-6 pt-6'>
      <LimitsSection />
    </div>
  );
}
