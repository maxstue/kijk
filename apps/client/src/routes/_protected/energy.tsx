import { Suspense, useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Leaf, List, Plus, TrendingUp } from 'lucide-react';
import { z } from 'zod';

import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { getTransactionsQuery } from '@/app/budget/use-get-transactions-by';
import { EnergyCreateForm } from '@/app/energy/energy-create-form';
import { EnergyMonthNav } from '@/app/energy/energy-month-nav';
import { EnergyMonthTable } from '@/app/energy/energy-month-table';
import { EnergyTodayButton } from '@/app/energy/energy-today-button';
import { EnergyYearSwitcher } from '@/app/energy/energy-year-switcher';
import { Head } from '@/shared/components/head';
import { NotFound } from '@/shared/components/not-found';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Separator } from '@/shared/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Months, months } from '@/shared/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .catch(months[new Date().getMonth()]!),
  year: z.number().catch(new Date().getFullYear()),
});

export const Route = createFileRoute('/_protected/energy')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  preSearchFilters: [
    (search) => ({
      ...search,
    }),
  ],
  loader: ({ deps: { month, year }, context: { queryClient } }) => {
    return queryClient.ensureQueryData(getTransactionsQuery(year, month));
  },
  component: EnergyPage,
  notFoundComponent: NotFound,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
});

function EnergyPage() {
  const [showSheet, setShowSheet] = useState(false);
  const searchParameters = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleClose = useCallback(() => {
    setShowSheet(false);
  }, []);

  useEffect(() => {
    navigate({
      to: '/energy',
      search: (previous) => ({ ...previous, ...searchParameters }),
    });
  }, [navigate, searchParameters, searchParameters.month, searchParameters.year]);

  return (
    <>
      <Head title='Energy' />
      <div className='space-y-6 pt-10'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Energy</h2>
          <p className='text-muted-foreground'>Manage your monthly energy usage</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          {/* Content */}
          <div className='flex-1'>
            <div className='flex flex-col space-y-4'>
              <div className='grid gap-4 lg:grid-cols-2'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Consumption</CardTitle>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>156,78 Kwh</div>
                    <p className='text-xs text-muted-foreground'>+1.8% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Year Overview</CardTitle>
                    <Leaf className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>901,78 Kwh</div>
                    <p className='text-xs text-muted-foreground'>+2.7% from last year</p>
                  </CardContent>
                </Card>
              </div>

              <div className='flex w-full justify-end'>
                <Sheet open={showSheet} onOpenChange={setShowSheet}>
                  <div className='flex w-full justify-between'>
                    <div className='flex w-1/3 justify-start gap-4'>
                      <EnergyTodayButton />
                      <Suspense fallback={<AsyncLoader />}>
                        <EnergyYearSwitcher />
                      </Suspense>
                      <Suspense fallback={<AsyncLoader />}>
                        <EnergyMonthNav />
                      </Suspense>
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
                      <EnergyCreateForm
                        month={searchParameters.month}
                        year={searchParameters.year}
                        onClose={handleClose}
                      />
                    </Suspense>
                  </SheetContent>
                </Sheet>
              </div>

              <div className='w-full'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Month Overview</CardTitle>
                    <List className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent className='h-[calc(100dvh_*_0.4)]'>
                    <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
                      <EnergyMonthTable />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
