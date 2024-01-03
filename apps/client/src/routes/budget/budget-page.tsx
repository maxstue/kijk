import { ComponentPropsWithoutRef, Suspense, useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Check, ChevronDown, ChevronsUpDown, DollarSign, List, PlusCircle, Users } from 'lucide-react';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { BudgetMonthCalendar } from '@/app/budget/budget-month-calender';
import { BudgetYearCalendar } from '@/app/budget/budget-year-calendar';
import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Months, months } from '@/types/app';

export function BudgetPage() {
  const navigate = useNavigate({ from: '/home/budget' });
  const [showSheet, setShowSheet] = useState(false);
  const searchParams = useSearch({ from: '/home/budget' });
  const month = (searchParams.month ?? months[new Date().getMonth()]) as Months;
  const year = (searchParams.year ?? new Date().getFullYear()) as number;

  const handleClose = () => setShowSheet(false);

  const { data } = useGetTransactionsBy(year, month);

  useEffect(() => {
    if (searchParams.year == null) {
      void navigate({
        search: () => ({ year: year.toString() }),
      });
    }
    if (searchParams.month == null) {
      void navigate({ search: () => ({ month }) });
    }
  }, [navigate, month, year, searchParams]);

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
            <YearSwitcher />
            <MonthNav />
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
  const searchParams = useSearch({ from: '/home/budget' });
  const navigate = useNavigate({ from: '/home/budget' });
  const currentMonth = (searchParams.month ?? months[new Date().getMonth()]) as Months;

  const handleNavigate = (item: Months) => {
    void navigate({ search: () => ({ month: item }) });
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

// TODO dont hardcode, safe in DB or get currentyear
const yearGroups = [
  {
    label: 'Years',
    years: [2023, 2022],
  },
];

type YProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

function YearSwitcher({ className }: YProps) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParams = useSearch({ from: '/home/budget' });
  const navigate = useNavigate({ from: '/home/budget' });

  const selectedYear = (searchParams.year ?? new Date().getFullYear() ?? yearGroups[0].years[0]) as number;

  const handleSelectYear = (year: number) => {
    setOpen(false);
    void navigate({ search: () => ({ year: year.toString() }) });
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
              {yearGroups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.years.map((year) => (
                    <CommandItem key={year} onSelect={(y) => handleSelectYear(Number(y))} className='text-sm'>
                      {year}
                      <Check className={cn('ml-auto h-4 w-4', selectedYear === year ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewYearDialog(true);
                    }}
                  >
                    <PlusCircle className='mr-2 h-5 w-5' />
                    Add new year
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new Year</DialogTitle>
          <DialogDescription>Add a new year to manage.</DialogDescription>
        </DialogHeader>
        <div>
          <div className='space-y-4 py-2 pb-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Year</Label>
              <Input id='name' placeholder={(new Date().getFullYear() + 1).toString()} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setShowNewYearDialog(false)}>
            Cancel
          </Button>
          <Button type='submit'>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
