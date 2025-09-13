import { toast } from 'sonner';

import { resourceSchema } from './schemas';
import type { ResourceFormValues } from './schemas';
import { useCreateResource } from '@/app/resources/use-create-resource';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface Props {
  onClose?: () => void;
}

export function ResourceTypeCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateResource();

  const form = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: '',
      color: '#000000',
      unit: '',
    },
  });

  function onSubmit(data: ResourceFormValues) {
    mutate(
      { resourceType: data },
      {
        onError(error) {
          toast.error(error.title, {
            description: error.errors?.[0]?.description ?? 'An error occurred',
          });
        },
        onSuccess() {
          toast('Successfully created');
          onClose?.();
        },
      },
    );
  }

  return (
    <>
      <Form {...form}>
        <form className='space-y-8' onSubmit={form.handleSubmit(onSubmit)}>
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
            name='unit'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder='Unit' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='color'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder='Color, e.g. `#123456`' type='color' {...field} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={isPending} type='submit'>
            Add
          </Button>
          {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
        </form>
      </Form>
    </>
  );
}
