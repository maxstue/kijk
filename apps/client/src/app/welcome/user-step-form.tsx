import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Input } from '@kijk/ui/components/input';
import { cn } from '@kijk/ui/utils/style';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type { UserStepFormValues } from '@/app/welcome/schemas';
import { userStepSchema } from '@/app/welcome/schemas';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/components/form';

interface Props {
  className?: string;
  value: UserStepFormValues;
  onNext: (values: UserStepFormValues) => void;
}

export function UserStepForm({ value, onNext, className }: Props) {
  const form = useForm({
    resolver: zodResolver(userStepSchema),
    values: value,
  });
  const { getValues } = form;

  useEffect(() => {
    return () => {
      onNext(getValues() as UserStepFormValues);
    };
  }, [getValues, onNext]);

  return (
    <div className={cn('grid gap-6', className)}>
      <Form {...form}>
        <form className='space-y-8' onSubmit={form.handleSubmit(onNext)}>
          <div className='grid gap-2'>
            <div className='grid gap-1'>
              <FormField
                control={form.control}
                name='userName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='Username' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex w-full items-center'>
              <FormField
                control={form.control}
                name='useDefaultResources'
                render={({ field }) => (
                  <FormItem className='flex w-full items-end justify-start gap-2'>
                    <FormLabel>Use default Resources</FormLabel>
                    <FormControl>
                      <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
