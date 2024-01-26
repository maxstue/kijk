import { useCreateCategory } from '@/app/settings/categories/use-create-category';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/hooks/use-toast';

import { CategoryFormValues, categorySchema } from './schemas';

interface Props {
  onClose?: () => void;
}

export function CategoryCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateCategory();
  const { toast } = useToast();

  const form = useZodForm({
    defaultValues: {
      name: '',
      color: '#000000',
    },
    schema: categorySchema,
  });

  function onSubmit(data: CategoryFormValues) {
    mutate(
      { category: data },
      {
        onError(error) {
          console.log(error);

          toast({
            title: `${error.data?.at(0)?.code}: ${error.data?.at(0)?.message}`,
            description: error.message,
            variant: 'destructive',
          });
        },
        onSuccess() {
          toast({
            title: 'Successfully created',
            variant: 'default',
          });
          onClose?.();
        },
      },
    );
  }

  return (
    <div>
      <Form form={form} onSubmit={onSubmit} className='space-y-8'>
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
          name='color'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input type='color' placeholder='Color, e.g. `#123456`' {...field} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isPending}>
          Add
        </Button>
        {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
      </Form>
    </div>
  );
}
