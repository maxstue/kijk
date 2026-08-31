import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { z } from 'zod';

import { ConsumptionLimitWarnings } from '@/app/consumption-limits/warnings';
import { ConsumptionCreateForm } from '@/app/consumptions/create-form';
import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionMonthNav } from '@/app/consumptions/month-nav';
import ConsumptionStats from '@/app/consumptions/stats';
import { ConsumptionTodayButton } from '@/app/consumptions/today-button';
import { ConsumptionYearSwitcher } from '@/app/consumptions/year-switcher';
import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';
import { consumptionsByQueryOptions } from '@/shared/api/consumptions/options';
import { NotFound } from '@/shared/components/not-found';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { getMonthFromDate, monthSchema } from '@/shared/utils/months';

const searchSchema = z.object({
  month: monthSchema.default(getMonthFromDate(new Date())),
  year: z.number().default(new Date().getFullYear()),
});

export const Route = createFileRoute('/_authenticated/_app/consumptions')({
  component: UsagePage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  notFoundComponent: NotFound,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.ensureQueryData(consumptionsByQueryOptions(deps.year, deps.month)),
      queryClient.ensureQueryData(consumptionLimitsQueryOptions()),
    ]);
  },
});

function UsagePage() {
  useSetSiteHeader('Consumptions');
  const [showDialog, setShowDialog] = useState(false);
  const { month, year } = Route.useSearch();
  const { data } = useSuspenseQuery(consumptionsByQueryOptions(year, month));

  const handleClose = () => setShowDialog(false);

  return (
    <div className='space-y-6 pt-10'>
      <ConsumptionLimitWarnings />
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Resource usage</h2>
        <p className='text-muted-foreground'>Manage your monthly resource usage</p>
      </div>
      <Separator className='my-6' />
      <div className='flex flex-col gap-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1'>
          <div className='flex flex-col gap-4'>
            <Suspense fallback={<Loader />}>
              <ConsumptionStats />
            </Suspense>

            <div className='flex w-full justify-end'>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <div className='flex w-full justify-between'>
                  <div className='flex w-1/3 justify-start gap-4'>
                    <Suspense>
                      <ConsumptionTodayButton />
                      <ConsumptionYearSwitcher />
                      <ConsumptionMonthNav />
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
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <Suspense fallback={<Loader />}>
                {data.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-2'>
                      <div className='text-muted-foreground flex items-center justify-between'>
                        Amount
                        <div className='text-foreground'>{item.value}</div>
                      </div>
                      <div className='text-muted-foreground flex items-center justify-between'>
                        Unit
                        <ResourceUnit type={item.resource} />
                      </div>
                    </CardContent>
                    <CardFooter className='flex w-full justify-end gap-2'>
                      <ConsumptionDeleteButton id={item.id} date={item.date} />
                      <ConsumptionEditButton data={item} />
                    </CardFooter>
                  </Card>
                ))}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
