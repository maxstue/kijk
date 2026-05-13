import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Separator } from '@kijk/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kijk/ui/components/sheet';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { z } from 'zod';

import { ConsumptionCreateForm } from '@/app/consumptions/create-form';
import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionMonthNav } from '@/app/consumptions/month-nav';
import ConsumptionStats from '@/app/consumptions/stats';
import { ConsumptionTodayButton } from '@/app/consumptions/today-button';
import { ConsumptionYearSwitcher } from '@/app/consumptions/year-switcher';
import { consumptionsByQueryOptions } from '@/shared/api/consumptions/options';
import { NotFound } from '@/shared/components/not-found';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import type { Months } from '@/shared/utils/months';
import { months } from '@/shared/utils/months';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .default(months[new Date().getMonth()]),
  year: z.number().default(new Date().getFullYear()),
});

export const Route = createFileRoute('/_protected/consumptions')({
  component: UsagePage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  notFoundComponent: NotFound,
  pendingComponent: () => <Loader className='h-6 w-6' />,
  loader: ({ context: { queryClient }, deps }) => {
    queryClient.ensureQueryData(consumptionsByQueryOptions(deps.year, deps.month));
  },
});

function UsagePage() {
  useSetSiteHeader('Consumptions');
  const [showSheet, setShowSheet] = useState(false);
  const { month, year } = Route.useSearch();
  const { data } = useSuspenseQuery(consumptionsByQueryOptions(year, month));

  const handleClose = () => setShowSheet(false);

  return (
    <div className='space-y-6 pt-10'>
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
              <Sheet open={showSheet} onOpenChange={setShowSheet}>
                <div className='flex w-full justify-between'>
                  <div className='flex w-1/3 justify-start gap-4'>
                    <ConsumptionTodayButton />
                    <Suspense>
                      <ConsumptionYearSwitcher />
                    </Suspense>
                    <ConsumptionMonthNav />
                  </div>
                  <SheetTrigger asChild>
                    <Button variant='outline'>
                      Add <Plus />
                    </Button>
                  </SheetTrigger>
                </div>
                <SheetContent className='space-y-8'>
                  <SheetHeader>
                    <SheetTitle>Add Consumption</SheetTitle>
                    <SheetDescription>Add a new consumption.</SheetDescription>
                  </SheetHeader>
                  <Suspense>
                    <ConsumptionCreateForm onClose={handleClose} />
                  </Suspense>
                </SheetContent>
              </Sheet>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
