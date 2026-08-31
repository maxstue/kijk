import { createFileRoute } from '@tanstack/react-router';

import { ConsumptionLimitsSection } from '@/app/consumption-limits/section';
import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_app/consumptions-limits')({
  component: ConsumptionLimitsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(consumptionLimitsQueryOptions()),
      queryClient.ensureQueryData(resourcesQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function ConsumptionLimitsPage() {
  useSetSiteHeader('Consumption limits');

  return (
    <div className='space-y-6 pt-10'>
      <ConsumptionLimitsSection />
    </div>
  );
}
