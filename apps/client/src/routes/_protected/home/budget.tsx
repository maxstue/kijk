import { ComponentPropsWithoutRef, Suspense, useCallback, useEffect, useState } from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { FileRoute, useNavigate } from '@tanstack/react-router';
import { Check, ChevronDown, ChevronsUpDown, DollarSign, List, PlusCircle, Users } from 'lucide-react';
import { z } from 'zod';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { BudgetMonthCalendar } from '@/app/budget/budget-month-calender';
import { BudgetYearCalendar } from '@/app/budget/budget-year-calendar';
import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
import { getYears, useGetYears } from '@/app/budget/use-get-years';
import { AppRouteError } from '@/components/app-route-error';
import { AsyncLoader } from '@/components/async-loader';
import { DataTable } from '@/components/data-table';
import { Head } from '@/components/head';
import { Loader } from '@/components/loader';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { useZodForm } from '@/components/ui/form/use-zod-form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Months, months } from '@/types/app';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .optional()
    .catch(months[new Date().getMonth()] as Months),
  year: z.number().optional().catch(new Date().getFullYear()),
});

export const Route = new FileRoute('/_protected/home/budget').createRoute({
  validateSearch: searchSchema,
  component: BudgetPage,
  errorComponent: AppRouteError,
});

function BudgetPage() {
  const [showSheet, setShowSheet] = useState(false);
  const searchParams = Route.useSearch();
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const year = searchParams.year ?? new Date().getFullYear();
  const { data } = useGetTransactionsBy(year, month);

  const handleClose = () => setShowSheet(false);

  // TODO load years in loader and await them inside component
  // TODO load months in loader and await them inside component

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
              <YearSwitcher />
            </Suspense>
            <Suspense fallback={<AsyncLoader />}>
              <MonthNav />
            </Suspense>
          </aside>
          {/* Content */}
          <div className='flex-1'>
            <div className='flex flex-col space-y-4'>
              <YearCalenderCard year={year} />
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
                    <Suspense fallback={<Loader className='h-4 w-4' />}>
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
}

type MProps = React.HTMLAttributes<HTMLElement>;

function YearCalenderCard({ year }: { year: number }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((c) => !c);

  return (
    <div className='flex w-full'>
      <Card className='w-full'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Year overview</CardTitle>
          <Button variant='ghost' className='' size='icon-sm' onClick={handleToggle}>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground', open && 'rotate-180')} />
          </Button>
          {/* <Calendar className='h-4 w-4 text-muted-foreground' /> */}
        </CardHeader>
        {open && (
          <CardContent className='pt-0'>
            <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
              <BudgetYearCalendar year={year} />
            </Suspense>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function MonthNav({ className, ...props }: MProps) {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();
  const currentMonth = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;

  useEffect(() => {
    if (searchParams.month == null) {
      void navigate({ search: (prev) => ({ ...prev, month }) });
    }
  }, [navigate, month, searchParams]);

  const handleNavigate = (item: Months) => {
    void navigate({ search: (prev) => ({ ...prev, month: item }) });
  };

  return currentMonth ? (
    <nav className={cn('flex gap-2 overflow-auto py-2 lg:h-[calc(100dvh_*_0.60)] lg:flex-col', className)} {...props}>
      {months.map((item) => {
        return (
          <Button
            key={item}
            variant='ghost'
            onClick={() => handleNavigate(item)}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              currentMonth === item ? 'bg-primary text-primary-foreground' : '',
              'mx-2 justify-start',
            )}
          >
            {item}
          </Button>
        );
      })}
    </nav>
  ) : (
    <div className='text-muted-foreground'>Select a year</div>
  );
}

type YProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

function YearSwitcher({ className }: YProps) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useGetYears();

  const selectedYear = searchParams.year ?? new Date().getFullYear() ?? data.data?.years.at(0);

  const validateDefaultYear = useCallback(
    () =>
      searchParams.year == null ||
      (searchParams.year && data.data?.years.length && !data.data?.years.includes(Number(searchParams.year))),
    [data.data?.years, searchParams.year],
  );

  useEffect(() => {
    if (validateDefaultYear()) {
      void navigate({ search: (prev) => ({ ...prev, year: new Date().getFullYear() }) });
    }
  }, [navigate, searchParams.year, validateDefaultYear]);

  const handleSelectYear = (year: number) => {
    setOpen(false);
    void navigate({ search: (prev) => ({ ...prev, year: year }) });
  };

  const handleNewYearClick = () => {
    setOpen(false);
    setShowNewYearDialog(true);
  };

  const handleCloseNewYearDialog = () => {
    setShowNewYearDialog(false);
  };

  return (
    <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            role='combobox'
            aria-expanded={open}
            aria-label='Select a year'
            className={cn('w-[200px] justify-between', className)}
          >
            {selectedYear}
            <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0'>
          <Command>
            <CommandList>
              <CommandInput placeholder='Search Year...' />
              <CommandEmpty>No Year found.</CommandEmpty>
              <Suspense fallback={<AsyncLoader />}>
                <CommandGroup key='years' heading='Years'>
                  {data.data?.years.map((yearData) => (
                    <CommandItem key={yearData} onSelect={(y) => handleSelectYear(Number(y))} className='text-sm'>
                      {yearData}
                      <Check
                        className={cn('ml-auto h-4 w-4', selectedYear === yearData ? 'opacity-100' : 'opacity-0')}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Suspense>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem onSelect={handleNewYearClick}>
                    <PlusCircle className='mr-2 h-5 w-5' />
                    Add new year
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddNewYearDialog onClose={handleCloseNewYearDialog} />
    </Dialog>
  );
}

const yearSchema = z.object({
  year: z.coerce.number().min(1970).max(9999),
});

type YearFormValues = z.infer<typeof yearSchema>;

function AddNewYearDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const form = useZodForm({
    values: { year: new Date().getFullYear() + 1 },
    mode: 'onBlur',
    schema: yearSchema,
  });

  const { toast } = useToast();

  function onSubmit(data: YearFormValues) {
    const response = queryClient.getQueryData(getYears.queryKey);
    if (response?.data?.years.includes(data.year)) {
      form.setError('year', { message: 'Year already exists' });
      return;
    }

    queryClient.setQueryData(getYears.queryKey, (old) =>
      old
        ? {
            ...old,
            data: { years: [...(old.data?.years ?? []), data.year].sort((a, b) => b - a) },
          }
        : old,
    );
    void navigate({ search: (prev) => ({ ...prev, year: data.year }) });
    onClose();
  }
  const handleError = () => {
    toast({
      title: 'Error adding new year',
      variant: 'destructive',
    });
  };

  const onCancel = () => {
    form.reset();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add new Year</DialogTitle>
        <DialogDescription>Add a new year to manage.</DialogDescription>
      </DialogHeader>
      <Form form={form} onSubmit={onSubmit} onInvalid={handleError} className='space-y-8'>
        <div className='space-y-4 py-2 pb-4'>
          <div className='space-y-2'>
            <FormField
              control={form.control}
              name='year'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder={(new Date().getFullYear() + 1).toString()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' onClick={onCancel} variant='outline'>
              Cancel
            </Button>
          </DialogClose>
          <Button type='submit'>Continue</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
