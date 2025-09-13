import { useEffect } from 'react';

import type { UserStepFormValues } from '@/app/welcome/schemas';
import { userStepSchema } from '@/app/welcome/schemas';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/helpers';

interface Props {
  className?: string;
  value: UserStepFormValues;
  onNext: (values: UserStepFormValues) => void;
}

export function UserStepForm({ value, onNext, className }: Props) {
  const form = useZodForm({
    schema: userStepSchema,
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
      <Form className='space-y-8' form={form} onInvalid={form.handleInvalidFormState} onSubmit={onNext}>
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
      </Form>
    </div>
  );
}
