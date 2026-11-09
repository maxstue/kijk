import * as consumptionsOptions from '@kijk/api/consumptions/options';
import * as limitsOptions from '@kijk/api/limits/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Skeleton } from '@kijk/ui/components/skeleton';
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
import { NotFound } from '@/shared/components/not-found';
import { PageAddButton } from '@/shared/components/page-header';
import { PageToolbarControls, PageToolbarActions, PageToolbar } from '@/shared/components/page-toolbar';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { getMonthFromDate, monthSchema } from '@/shared/utils/months';

const searchSchema = z.object({
  create: z.boolean().optional().catch(undefined),
  month: monthSchema.default(getMonthFromDate(new Date())),
  view: z.enum(['month', 'year']).default('month'),
  year: z.number().default(new Date().getFullYear()),
});

/** `/consumptions`: consumptions of the year/month in the search params, with statistics. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/_overview')({
  validateSearch: zodValidator(searchSchema),
  component: UsagePage,
  loaderDeps: ({ search: { month, view, year } }) => ({ month, view, year }),
  loader: async ({ params: { spaceId }, context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(consumptionsOptions.yearsQueryOptions(spaceId));
    if (deps.view === 'month') {
      void queryClient.prefetchQuery(consumptionsOptions.statisticsQueryOptions(spaceId, deps.year, deps.month));
    }
    await Promise.all([
      queryClient.query({
        ...consumptionsOptions.listQueryOptions(spaceId, deps.year, deps.view === 'month' ? deps.month : undefined),
        staleTime: 'static',
      }),
      queryClient.query({ ...consumptionsOptions.listQueryOptions(spaceId, deps.year), staleTime: 'static' }),
      queryClient.query({ ...limitsOptions.listQueryOptions(spaceId), staleTime: 'static' }),
    ]);
  },
  notFoundComponent: NotFound,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  head: () => ({ meta: [{ title: 'Consumptions' }] }),
});

function UsagePage() {
  const spaceId = useSpaceId();
  const canRecord = useSpacePermission(SpacePermissions.consumptions.record);
  const [showDialog, setShowDialog] = useState(false);
  const { month, view, year, create } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(
    consumptionsOptions.listQueryOptions(spaceId, year, view === 'month' ? month : undefined),
  );
  const { data: yearlyConsumptions } = useSuspenseQuery(consumptionsOptions.listQueryOptions(spaceId, year));

  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open && create) {
      void navigate({ replace: true, search: (previous) => ({ ...previous, create: undefined }) });
    }
  };
  const handleClose = () => handleDialogChange(false);

  return (
    <div data-guide='consumptions' className='space-y-6 pt-6'>
      <PageToolbar>
        <PageToolbarControls data-guide='consumption-period'>
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
          <Suspense fallback={<Skeleton className='h-10 w-64' />}>
            {view === 'month' ? (
              <ConsumptionMonthNav />
            ) : (
              <>
                <ConsumptionCurrentPeriodButton view={view} />
                <ConsumptionYearSwitcher className='w-auto min-w-28' />
              </>
            )}
          </Suspense>
        </PageToolbarControls>
        <PageToolbarActions>
          <Dialog open={canRecord && (showDialog || create === true)} onOpenChange={handleDialogChange}>
            <DialogTrigger
              render={
                <PageAddButton
                  data-guide='consumption-create'
                  disabled={!canRecord}
                  title={canRecord ? undefined : 'Your role in this space does not allow recording consumptions'}
                />
              }
            >
              Add consumption
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Consumption</DialogTitle>
                <DialogDescription>Add a new consumption.</DialogDescription>
              </DialogHeader>
              <ConsumptionCreateForm consumptions={yearlyConsumptions} onClose={handleClose} />
            </DialogContent>
          </Dialog>
        </PageToolbarActions>
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
