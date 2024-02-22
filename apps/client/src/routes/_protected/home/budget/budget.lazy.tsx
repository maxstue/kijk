import { Suspense, useState } from 'react';
import { RouteApi } from '@tanstack/react-router';
import { DollarSign, List, Users } from 'lucide-react';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { BudgetMonthCalendar } from '@/app/budget/budget-month-calender';
import { BudgetMonthNav } from '@/app/budget/budget-month-nav';
import { BudgetYearCalenderCard } from '@/app/budget/budget-year-calender-card';
import { BudgetYearSwitcher } from '@/app/budget/budget-year-switchet';
import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
import { DataTable } from '@/shared/components/data-table';
import { Head } from '@/shared/components/head';
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

const route = new RouteApi({ id: '/_protected/home/budget' });

export const component = function BudgetPage() {
  const [showSheet, setShowSheet] = useState(false);
  const searchParams = route.useSearch();
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const year = searchParams.year ?? new Date().getFullYear();
  const { data } = useGetTransactionsBy(year, month);

  const handleClose = () => setShowSheet(false);

  return (
    <>
      <Head title='Budget' />
      <div className='space-y-6 pt-10'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Expenses / Income</h2>
          <p className='text-muted-foreground'>Manage your Expenses and Incomes.</p>
        </div>
        <Separator className='my-6' />
        {/* Sidebar */}
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='flex h-full flex-col gap-4 lg:w-1/5'>
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
              <BudgetYearCalenderCard year={year} />
              <div className='grid gap-4 lg:grid-cols-2'>
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
                      <BudgetMonthCalendar year={year} month={month} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              <div className='w-full'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Month Overview</CardTitle>
                    <List className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={data?.data ?? []}
                      columns={budgetColumns}
                      defaultSort={budgetDefaultSort}
                      actions={
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
                              <TransactionCreateForm year={year} month={month} onClose={handleClose} />
                            </Suspense>
                          </SheetContent>
                        </Sheet>
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
