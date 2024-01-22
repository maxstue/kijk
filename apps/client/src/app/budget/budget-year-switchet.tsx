import { ComponentPropsWithoutRef, Suspense, useCallback, useEffect, useState } from 'react';
import { DialogClose } from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { RouteApi, useNavigate } from '@tanstack/react-router';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { z } from 'zod';

import { getYears, useGetYears } from '@/app/budget/use-get-years';
import { AsyncLoader } from '@/components/async-loader';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const route = new RouteApi({ id: '/_protected/home/budget' });

type YProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

export function BudgetYearSwitcher({ className }: YProps) {
  const [open, setOpen] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const searchParams = route.useSearch();
  const navigate = useNavigate({ from: '/home/budget' });
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
  const navigate = useNavigate({ from: '/home/budget' });
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
