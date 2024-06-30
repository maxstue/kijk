import { Suspense, useCallback, useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DollarSign, List, Users } from 'lucide-react';
import { z } from 'zod';

import { BudgetMonthCalendar } from '@/app/budget/budget-month-calender';
import { BudgetMonthNav } from '@/app/budget/budget-month-nav';
import { BudgetMonthOverview } from '@/app/budget/budget-month-table';
import { BudgetTodayButton } from '@/app/budget/budget-today-button';
import { BudgetYearCalenderCard } from '@/app/budget/budget-year-calender-card';
import { BudgetYearSwitcher } from '@/app/budget/budget-year-switcher';
import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { getTransactionsQuery } from '@/app/budget/use-get-transations-by';
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
    .catch(months[new Date().getMonth()]),
  year: z.number().catch(new Date().getFullYear()),
});

export const Route = createFileRoute('/_protected/budget')({
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  loader: ({ deps: { month, year }, context: { queryClient } }) => {
    return queryClient.ensureQueryData(getTransactionsQuery(year, month));
  },
  preSearchFilters: [
    (search) => ({
      ...search,
    }),
  ],
  validateSearch: searchSchema,
  component: BudgetPage,
  notFoundComponent: NotFound,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
});

function BudgetPage() {
  const [showSheet, setShowSheet] = useState(false);
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleClose = useCallback(() => setShowSheet(false), []);

  useEffect(() => {
    navigate({
      to: '/budget',
      search: (prev) => ({ ...prev, ...searchParams }),
    });
  }, [navigate, searchParams, searchParams.month, searchParams.year]);

  return (
    <>
      <Head title='Budget' />
      <div className='space-y-6 pt-10'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Transactions</h2>
          <p className='text-muted-foreground'>Manage your Expenses and Incomes.</p>
        </div>
        <Separator className='my-6' />
        {/* Sidebar */}
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='flex h-full flex-col gap-4 lg:min-w-[20%]'>
            <BudgetTodayButton />
            <Suspense fallback={<AsyncLoader />}>
              <BudgetYearSwitcher />
            </Suspense>
            <Suspense fallback={<AsyncLoader />}>
              <BudgetMonthNav />
            </Suspense>
          </aside>
          {/* Content */}
          <div className='flex-1'>
            <div className='flex flex-col space-y-4'>
              <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
                <BudgetYearCalenderCard year={searchParams.year} />
              </Suspense>
              <div className='grid h-72 gap-4 lg:grid-cols-2'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Balance</CardTitle>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>$4,231.89</div>
                    <p className='text-xs text-muted-foreground'>+2.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Month Overview</CardTitle>
                    <Users className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
                      <BudgetMonthCalendar year={searchParams.year} month={searchParams.month} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              <div className='flex w-full justify-end'>
                <Sheet open={showSheet} onOpenChange={setShowSheet}>
                  <SheetTrigger asChild>
                    <Button variant='outline'>Create Transaction</Button>
                  </SheetTrigger>
                  <SheetContent className='space-y-8'>
                    <SheetHeader>
                      <SheetTitle>Create Transaction</SheetTitle>
                      <SheetDescription>Create a new transaction.</SheetDescription>
                    </SheetHeader>
                    <Suspense>
                      <TransactionCreateForm
                        year={searchParams.year}
                        month={searchParams.month}
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
                      <BudgetMonthOverview />
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
