import { ComponentPropsWithoutRef, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useLocation, useNavigate } from '@tanstack/react-router';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { z } from 'zod';

import { getYearsQuery, useGetYears } from '@/app/budget/use-get-years';
import { Button } from '@/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/helpers';

const Route = getRouteApi('/_protected/budget');

type YProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

export function BudgetYearSwitcher({ className }: YProps) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const location = useLocation();

  const { data } = useGetYears();
  const queryClient = useQueryClient();

  const selectedYear = searchParams.year ?? new Date().getFullYear() ?? data.data?.years.at(0);
  const years = useMemo(() => data.data?.years ?? [], [data.data?.years]);

  // add year from url to array if it doesn't exist
  useEffect(() => {
    if (years.length > 0 && !years.includes(Number(searchParams.year))) {
      years.push(Number(searchParams.year));
    }
  }, [queryClient, searchParams.year, years]);

  // set year in the url when it is not set
  useEffect(() => {
    if (!location.search.year && location.pathname.includes('budget')) {
      navigate({ to: '/budget', search: (prev) => ({ ...prev, year: searchParams.year }) });
    }
  }, [location.pathname, location.search.year, navigate, searchParams.year]);

  const handleSelectYear = (year: number) => {
    setOpen(false);
    navigate({ search: (prev) => ({ ...prev, year: year }) });
  };

  const handleNewYearClick = useCallback(() => {
    setOpen(false);
    setShowNewYearDialog(true);
  }, []);

  const handleCloseNewYearDialog = useCallback(() => {
    setShowNewYearDialog(false);
  }, []);

  return (
    <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-label='Select a year'
            className={cn('w-full justify-between', className)}
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
                  {years.map((yearData) => (
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
  const navigate = useNavigate({ from: '/budget' });
  const form = useZodForm({
    values: { year: new Date().getFullYear() + 1 },
    mode: 'onBlur',
    schema: yearSchema,
  });

  const { toast } = useToast();

  function onSubmit(data: YearFormValues) {
    const response = queryClient.getQueryData(getYearsQuery.queryKey);
    if (response?.data?.years.includes(data.year)) {
      form.setError('year', { message: 'Year already exists' });
      return;
    }

    queryClient.setQueryData(getYearsQuery.queryKey, (old) =>
      old
        ? {
            ...old,
            data: { years: [...(old.data?.years ?? []), data.year].sort((a, b) => b - a) },
          }
        : old,
    );
    navigate({ search: (prev) => ({ ...prev, year: data.year }) });
    onClose();
  }
  const handleError = useCallback(() => {
    toast({
      title: 'Error adding new year',
      variant: 'destructive',
    });
  }, [toast]);

  const onCancel = useCallback(() => {
    form.reset();
  }, [form]);

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
          <Button type='button' onClick={onCancel} variant='outline'>
            Cancel
          </Button>
          <Button type='submit'>Continue</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
