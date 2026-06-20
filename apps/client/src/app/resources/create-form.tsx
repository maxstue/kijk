import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ResourceColorField, ResourceNameField, ResourceUnitField } from '@/app/resources/form-fields';
import { useCreateResource } from '@/app/resources/use-create-resource';
import { Form, FormField } from '@/shared/components/form';

import { resourceSchema } from './schemas';
import type { ResourceFormValues } from './schemas';

interface Props {
  onClose?: () => void;
}

export function ResourceTypeCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateResource();

  const form = useForm({
    defaultValues: {
      color: '#000000',
      name: '',
      unit: '',
    },
    resolver: zodResolver(resourceSchema),
  });

  function onSubmit(data: ResourceFormValues) {
    mutate(data, {
      onError(error) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess() {
        toast.success('Successfully created');
        onClose?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4 px-2' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField control={form.control} name='name' render={(props) => <ResourceNameField {...props} />} />
        <FormField control={form.control} name='unit' render={(props) => <ResourceUnitField {...props} />} />
        <FormField control={form.control} name='color' render={(props) => <ResourceColorField {...props} />} />
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <Icons.spinner className='size-5 animate-spin' /> : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
