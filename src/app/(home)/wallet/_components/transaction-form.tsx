'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  amount: z.string().min(1, {
    message: 'Amount must be at least 1 character.',
  }),
  categories: z.string().array().optional(),
  // TODO make as enum
  type: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function TransactionForm() {
  const [show, setShow] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  function onSubmit(data: FormValues) {
    console.log('submit', data);
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

            <Button type='submit'>Add</Button>
          </form>
        </Form>
      )}
    </div>
  );
}
