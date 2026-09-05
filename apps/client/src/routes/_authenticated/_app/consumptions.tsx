import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Separator } from '@kijk/ui/components/separator';
import { Tabs, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { z } from 'zod';

import { ConsumptionLimitWarnings } from '@/app/consumption-limits/warnings';
import { ConsumptionAnnualView } from '@/app/consumptions/annual-view';
import { ConsumptionCreateForm } from '@/app/consumptions/create-form';
import { ConsumptionCurrentPeriodButton } from '@/app/consumptions/current-period-button';
import { ConsumptionMonthNav } from '@/app/consumptions/month-nav';
import { ConsumptionMonthView } from '@/app/consumptions/month-view';
import { ConsumptionYearSwitcher } from '@/app/consumptions/year-switcher';
import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';
import { consumptionsByQueryOptions } from '@/shared/api/consumptions/options';
import { NotFound } from '@/shared/components/not-found';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { getMonthFromDate, monthSchema } from '@/shared/utils/months';

const searchSchema = z.object({
  month: monthSchema.default(getMonthFromDate(new Date())),
  view: z.enum(['month', 'year']).default('month'),
  year: z.number().default(new Date().getFullYear()),
});

export const Route = createFileRoute('/_authenticated/_app/consumptions')({
  component: UsagePage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, view, year } }) => ({ month, view, year }),
  notFoundComponent: NotFound,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.ensureQueryData(
        consumptionsByQueryOptions(deps.year, deps.view === 'month' ? deps.month : undefined),
      ),
      queryClient.ensureQueryData(consumptionLimitsQueryOptions()),
    ]);
  },
});

function UsagePage() {
  useSetSiteHeader('Consumptions');
  const [showDialog, setShowDialog] = useState(false);
  const { month, view, year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(consumptionsByQueryOptions(year, view === 'month' ? month : undefined));

  const handleClose = () => setShowDialog(false);

  return (
    <div className='space-y-6 pt-10'>
      <ConsumptionLimitWarnings />
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Resource usage</h2>
        <p className='text-muted-foreground'>Manage your monthly usage or review a full year by resource type</p>
      </div>
      <Separator className='my-6' />
      <div className='flex flex-col gap-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1'>
          <div className='flex flex-col gap-4'>
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

            <div className='flex w-full justify-end'>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <div className='flex w-full justify-between'>
                  <div className='flex w-1/3 justify-start gap-4'>
                    <Suspense>
                      <ConsumptionCurrentPeriodButton view={view} />
                      <ConsumptionYearSwitcher />
                      {view === 'month' ? <ConsumptionMonthNav /> : undefined}
                    </Suspense>
                  </div>
                  <DialogTrigger asChild>
                    <Button variant='outline'>
                      Add <Plus />
                    </Button>
                  </DialogTrigger>
                </div>
                <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
                  <DialogHeader>
                    <DialogTitle>Add Consumption</DialogTitle>
                    <DialogDescription>Add a new consumption.</DialogDescription>
                  </DialogHeader>
                  <Suspense>
                    <ConsumptionCreateForm onClose={handleClose} />
                  </Suspense>
                </DialogContent>
              </Dialog>
            </div>
            {view === 'year' ? (
              <ConsumptionAnnualView consumptions={data} />
            ) : (
              <ConsumptionMonthView consumptions={data} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
