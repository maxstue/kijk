import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Check, ChevronsUpDown, DollarSign, Download, List, PlusCircle, Users } from 'lucide-react';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
import { DataTable } from '@/components/data-table';
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
import { budgetRoute } from '@/routes/budget/budget-route';
import { months } from '@/types/app';

export function BudgetPage() {
  const navigate = useNavigate({ from: budgetRoute.id });
  const searchParams = useSearch({ from: budgetRoute.id });
  const month = searchParams.month ?? months[new Date().getMonth()];
  const year = searchParams.year ?? new Date().getFullYear();
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = () => setShowSheet(false);

  const { data } = useGetTransactionsBy(year, month);

  useEffect(() => {
    if (typeof searchParams.year == 'undefined') {
      void navigate({ search: (prev) => ({ ...prev, year: year }) });
    }
    if (typeof searchParams.month == 'undefined') {
      void navigate({ search: (prev) => ({ ...prev, month: month }) });
    }
  }, [month, navigate, searchParams.month, searchParams.year, year]);

  return (
    <div className='space-y-6 pt-10'>
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Expenses / Income</h2>
        <p className='text-muted-foreground'>Manage your Expenses and Incomes.</p>
      </div>
      <Separator className='my-6' />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
        <aside className='space-y-6 lg:w-1/5'>
          <YearSwitcher />
          <MonthNav />
        </aside>
        <div className='flex-1 pb-12'>
          <div className='flex flex-col space-y-4'>
            <div className='flex justify-end'>
              <Button size='sm' disabled>
                <Download className='h-4 w-4' />
              </Button>
            </div>
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
                  <CardTitle className='text-sm font-medium'>Year Overview</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  {/*TODO <div className='text-2xl font-bold'>&quot;Hier dann Chart&quot;</div> */}
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
                          <TransactionCreateForm year={year} month={month} onClose={handleClose} />
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
  );
}

type MProps = React.HTMLAttributes<HTMLElement>;

function MonthNav({ className, ...props }: MProps) {
  const searchParams = useSearch({ from: budgetRoute.id });
  const currentMonth = searchParams.month ?? months[new Date().getMonth()];

  return currentMonth ? (
    <nav className={cn('flex overflow-auto lg:flex-col', className)} {...props}>
      {months.map((item) => {
        return (
          <Link
            key={item}
            from={budgetRoute.id}
            search={(prev) => ({ ...prev, month: item })}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              currentMonth === item
                ? 'bg-muted-foreground text-white hover:bg-muted-foreground hover:text-white'
                : 'hover:bg-muted-foreground hover:text-white ',
              'justify-start',
            )}
          >
            {item}
          </Link>
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
  const searchParams = useSearch({ from: budgetRoute.id });
  const navigate = useNavigate({ from: budgetRoute.id });

  const selectedYear = searchParams.year ?? new Date().getFullYear().toString() ?? yearGroups[0].years[0];

  const handleSelectYear = (year: number) => {
    setOpen(false);
    void navigate({ search: (prev) => ({ ...prev, year: year }) });
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
