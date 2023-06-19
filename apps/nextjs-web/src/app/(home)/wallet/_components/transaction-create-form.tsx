'use client';

import React, { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { TransactionFormValues, transactionSchema } from '@/app/(home)/wallet/_components/schemas';
import { createTransaction } from '@/app/(home)/wallet/actions';
import { getMonthFromString } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Months } from '@/types/app';

interface Props {
  year?: string;
  month?: Months;
}

export function TransactionCreateForm({ month, year }: Props) {
  const [isPending, startTransition] = useTransition();
  const [show, setShow] = useState(false);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: '',
      amount: '',
    },
    mode: 'onBlur',
  });

  function onSubmit(data: TransactionFormValues) {
    const executionDate =
      typeof year !== 'undefined' && typeof month !== 'undefined'
        ? new Date(Number(year), getMonthFromString(month), new Date().getDate())
        : new Date();

    startTransition(async () => {
      await createTransaction({ ...data, executedAt: executionDate }).then(() => {
        toast({
          title: `Successfully created: ${data.name} `,
          variant: 'default',
        });
        form.reset();
      });
    });
  }

  return (
    <div>
      <Button variant='outline' onClick={() => setShow((c) => !c)}>
        {show ? 'Hide' : 'Show'}
      </Button>
      {show && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder='Amount of money' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a transaction type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='EXPENSE'>Expense</SelectItem>
                      <SelectItem value='INCOME'>Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex items-center gap-2'>
              <Button type='submit' disabled={isPending}>
                Add
              </Button>
              {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
