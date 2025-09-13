import { toast } from 'sonner';

import { resourceSchema } from './schemas';
import type { ResourceFormValues } from './schemas';
import { useCreateResource } from '@/app/resources/use-create-resource';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';

interface Props {
  onClose?: () => void;
}

export function ResourceTypeCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateResource();

  const form = useZodForm({
    defaultValues: {
      name: '',
      color: '#000000',
      unit: '',
    },
    schema: resourceSchema,
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
      <Form className='space-y-8' form={form} onSubmit={onSubmit}>
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
      </Form>
    </>
  );
}
