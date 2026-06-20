import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ResourceColorField, ResourceNameField, ResourceUnitField } from '@/app/resources/form-fields';
import type { ResourceFormValues } from '@/app/resources/schemas';
import { resourceSchema } from '@/app/resources/schemas';
import { useUpdateResource } from '@/app/resources/use-update-resource-type';
import { Form, FormField } from '@/shared/components/form';
import type { Resource } from '@/shared/types/domain';

interface Props {
  initialData: Resource;
  onClose: () => void;
}

export function ResourceTypeUpdateForm({ initialData, onClose }: Props) {
  const { isPending, mutate } = useUpdateResource();

  const form = useForm({
    defaultValues: {
      color: initialData.color,
      name: initialData.name,
      unit: initialData.unit,
    },
    resolver: zodResolver(resourceSchema),
  });

  const handleError = () => toast('Error updating');

  function onSubmit(data: ResourceFormValues) {
    mutate(
      { id: initialData.id, resourceType: data },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success('Successfully updated');
          onClose();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4 px-2' onSubmit={form.handleSubmit(onSubmit, handleError)} noValidate>
        <FormField control={form.control} name='name' render={(props) => <ResourceNameField {...props} />} />
        <FormField control={form.control} name='unit' render={(props) => <ResourceUnitField {...props} />} />
        <FormField control={form.control} name='color' render={(props) => <ResourceColorField {...props} />} />
        <Button className='mt-6' disabled={isPending} type='submit'>
          {isPending ? <Icons.spinner className='size-5 animate-spin' /> : 'Update'}
        </Button>
      </form>
    </Form>
  );
}
