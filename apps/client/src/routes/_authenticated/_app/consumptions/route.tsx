import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Tabs, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Suspense, useState } from 'react';
import { z } from 'zod';

import { ConsumptionAnnualView } from '@/app/consumptions/annual-view';
import { ConsumptionCreateForm } from '@/app/consumptions/create-form';
import { ConsumptionCurrentPeriodButton } from '@/app/consumptions/current-period-button';
import { ConsumptionMonthNav } from '@/app/consumptions/month-nav';
import { ConsumptionMonthView } from '@/app/consumptions/month-view';
import { ConsumptionYearSwitcher } from '@/app/consumptions/year-switcher';
import { LimitWarnings } from '@/app/limits/warnings';
import { consumptionsByQueryOptions } from '@/shared/api/consumptions/options';
import { limitsQueryOptions } from '@/shared/api/limits/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { NotFound } from '@/shared/components/not-found';
import { PageAddButton, PageToolbar } from '@/shared/components/page-header';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { getMonthFromDate, monthSchema } from '@/shared/utils/months';

const searchSchema = z.object({
  month: monthSchema.default(getMonthFromDate(new Date())),
  view: z.enum(['month', 'year']).default('month'),
  year: z.number().default(new Date().getFullYear()),
});

/** `/consumptions`: consumptions of the year/month in the search params, with statistics. */
export const Route = createFileRoute('/_authenticated/_app/consumptions')({
  component: UsagePage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, view, year } }) => ({ month, view, year }),
  notFoundComponent: NotFound,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.query({
        ...consumptionsByQueryOptions(deps.year, deps.view === 'month' ? deps.month : undefined),
        staleTime: 'static',
      }),
      queryClient.query({ ...consumptionsByQueryOptions(deps.year), staleTime: 'static' }),
      queryClient.query({ ...limitsQueryOptions(), staleTime: 'static' }),
    ]);
  },
});

function UsagePage() {
  useSetSiteHeader('Consumptions');
  const canRecord = useSpacePermission(SpacePermissions.consumptions.record);
  const [showDialog, setShowDialog] = useState(false);
  const { month, view, year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(consumptionsByQueryOptions(year, view === 'month' ? month : undefined));
  const { data: yearlyConsumptions } = useSuspenseQuery(consumptionsByQueryOptions(year));

  const handleClose = () => setShowDialog(false);

  return (
    <div className='space-y-6 pt-6'>
      <PageToolbar
        actions={
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <PageAddButton
                disabled={!canRecord}
                title={canRecord ? undefined : 'Your role in this space does not allow recording consumptions'}
              >
                Add consumption
              </PageAddButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Consumption</DialogTitle>
                <DialogDescription>Add a new consumption.</DialogDescription>
              </DialogHeader>
              <ConsumptionCreateForm consumptions={yearlyConsumptions} onClose={handleClose} />
            </DialogContent>
          </Dialog>
        }
      >
        <Tabs
          value={view}
          onValueChange={(nextView) =>
            navigate({ search: (previous) => ({ ...previous, view: nextView as 'month' | 'year' }) })
          }
        >
          <TabsList>
            <TabsTrigger value='month'>Monthly</TabsTrigger>
            <TabsTrigger value='year'>Annual</TabsTrigger>
          </TabsList>
        </Tabs>
        <Suspense>
          <ConsumptionCurrentPeriodButton view={view} />
          <ConsumptionYearSwitcher className='w-auto min-w-28' />
          {view === 'month' && <ConsumptionMonthNav className='w-auto min-w-36' />}
        </Suspense>
      </PageToolbar>
      <LimitWarnings />
      {view === 'year' ? (
        <ConsumptionAnnualView consumptions={data} />
      ) : (
        <ConsumptionMonthView consumptions={data} month={month} year={year} />
      )}
      <Outlet />
    </div>
  );
}
