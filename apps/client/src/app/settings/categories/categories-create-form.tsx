import { useCreateCategory } from '@/app/settings/categories/use-create-category';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import { CategoryTypes } from '@/shared/types/app';

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
      type: CategoryTypes.OTHER,
    },
    schema: categorySchema,
  });

  function onSubmit(data: CategoryFormValues) {
    mutate(
      { category: data },
      {
        onError(error) {
          toast({
            title: `${error.title}`,
            description: error.errors?.[0]?.description ?? 'An error occurred',
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

        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a category type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={CategoryTypes.EXPENSE}>Expense</SelectItem>
                  <SelectItem value={CategoryTypes.INCOME}>Income</SelectItem>
                  <SelectItem value={CategoryTypes.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isPending} type='submit'>
          Add
        </Button>
        {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
      </Form>
    </div>
  );
}
