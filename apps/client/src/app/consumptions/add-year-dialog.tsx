import { zodResolver } from '@hookform/resolvers/zod';
import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { Input } from '@kijk/ui/components/input';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';
const Route = getRouteApi('/_authenticated/_app/$spaceId/consumptions/_overview');

const yearSchema = z.object({
  year: z.number().min(1970).max(9999),
});

type YearFormValues = z.infer<typeof yearSchema>;

interface AddNewYearDialogProps {
  onClose: () => void;
}

export function AddNewYearDialog({ onClose }: AddNewYearDialogProps) {
  const spaceId = useSpaceId();
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const form = useForm({
    defaultValues: { year: new Date().getFullYear() + 1 },
    mode: 'onBlur',
    resolver: zodResolver(yearSchema),
  });

  function handleSubmit(data: YearFormValues) {
    const response = queryClient.getQueryData(consumptionsOptions.yearsQueryOptions(spaceId).queryKey);
    if (response?.years.map(Number).includes(data.year)) {
      form.setError('year', { message: 'Year already exists' });
      return;
    }

    queryClient.setQueryData(consumptionsOptions.yearsQueryOptions(spaceId).queryKey, (old) => ({
      years: [...(old?.years.map(Number) ?? []), data.year].sort((a, b) => b - a),
    }));
    navigate({
      params: { spaceId: spaceId },
      search: (previous) => ({ ...previous, year: data.year }),
      to: '/$spaceId/consumptions',
    });
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
