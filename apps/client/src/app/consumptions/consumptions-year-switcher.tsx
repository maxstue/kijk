import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@kijk/ui/components/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Input } from '@kijk/ui/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  getYearsFromConsumptionsQuery,
  useGetYearsFromConsumptions,
} from '@/app/consumptions/use-get-resources-usage-years';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { Loader } from '@/shared/components/ui/loaders/loader';

const Route = getRouteApi('/_protected/consumptions');

type YProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

export function ConsumptionsYearSwitcher({ className }: YProps) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParameters = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data } = useGetYearsFromConsumptions();
  const queryClient = useQueryClient();

  const selectedYear = searchParameters.year;
  const years = useMemo(() => data.years, [data.years]);

  // Add year from url to array if it doesn't exist
  useEffect(() => {
    if (years.length > 0 && !years.includes(Number(searchParameters.year))) {
      years.push(Number(searchParameters.year));
    }
  }, [queryClient, searchParameters.year, years]);

  const handleSelectYear = (year: number) => {
    setOpen(false);
    navigate({ search: (previous) => ({ ...previous, year: year }) });
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
            aria-expanded={open}
            aria-label='Select a year'
            className={cn('w-full justify-between', className)}
            role='combobox'
            aria-controls='year-popover'
            variant='outline'
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
              <Suspense fallback={<Loader />}>
                <CommandGroup key='years' heading='Years'>
                  {years.map((yearData) => (
                    <CommandItem
                      key={yearData}
                      className='text-sm'
                      onSelect={(y) => {
                        handleSelectYear(Number(y));
                      }}
                    >
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
                <DialogTrigger>
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
  year: z.number().min(1970).max(9999),
});

type YearFormValues = z.infer<typeof yearSchema>;

function AddNewYearDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const form = useForm({
    defaultValues: { year: new Date().getFullYear() + 1 },
    mode: 'onBlur',
    resolver: zodResolver(yearSchema),
  });

  function handleSubmit(data: YearFormValues) {
    const response = queryClient.getQueryData(getYearsFromConsumptionsQuery.queryKey);
    if (response?.years.map(Number).includes(data.year)) {
      form.setError('year', { message: 'Year already exists' });
      return;
    }

    queryClient.setQueryData(getYearsFromConsumptionsQuery.queryKey, (old) => ({
      years: [...(old?.years.map(Number) ?? []), data.year].sort((a, b) => b - a),
    }));
    navigate({ search: (previous) => ({ ...previous, year: data.year }), to: '/consumptions' });
    onClose();
  }

  const handleError = useCallback(() => {
    toast.error('Error adding new year');
  }, []);

  const handleCancel = useCallback(() => {
    form.reset();
  }, [form]);

  return (
    <DialogContent aria-description='add new year modal' title='Add new year'>
      <DialogHeader>
        <DialogTitle>Add new year</DialogTitle>
        <DialogDescription>Add a new year to manage.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form className='space-y-8' onSubmit={form.handleSubmit(handleSubmit, handleError)}>
          <div className='space-y-4 py-2 pb-4'>
            <div className='space-y-2'>
              <FormField
                control={form.control}
                name='year'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder={(new Date().getFullYear() + 1).toString()} type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit'>Continue</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
