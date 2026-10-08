import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { customCategoryIcon } from '@/app/categories/constants';
import { categorySchema } from '@/app/categories/schemas';
import type { CategoryFormValues } from '@/app/categories/schemas';
import { useCreateCategory, useUpdateCategory } from '@/app/categories/use-mutations';
import type { Category } from '@/shared/api/categories/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';

interface Props {
  initialData?: Category;
  onClose: () => void;
}

/** Form to create a custom category, or to edit `initialData` when given. */
export function CategoryForm({ initialData, onClose }: Props) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const form = useForm<CategoryFormValues>({
    defaultValues: {
      color: initialData?.color ?? '#64748b',
      kind: initialData?.kind ?? 'Expense',
      name: initialData?.name ?? '',
    },
    resolver: zodResolver(categorySchema),
  });

  function onSubmit(values: CategoryFormValues) {
    const data = { ...values, icon: initialData?.icon ?? customCategoryIcon };
    const onError = (error: Error) => toast.error(error.name, { description: error.message });
    const onSuccess = () => {
      toast.success(initialData ? 'Category updated' : 'Category created');
      onClose();
    };

    if (initialData) {
      updateMutation.mutate({ data, id: initialData.id }, { onError, onSuccess });
      return;
    }

    createMutation.mutate(data, { onError, onSuccess });
  }

  return (
    <Form {...form}>
      <form className='flex flex-col gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input maxLength={50} placeholder='Pets' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='kind'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kind</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='Expense'>Expense</SelectItem>
                  <SelectItem value='Income'>Income</SelectItem>
                </SelectContent>
              </Select>
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
                <Input className='p-1' type='color' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-6' disabled={isPending || (initialData && !form.formState.isDirty)} type='submit'>
          {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : initialData ? 'Update' : 'Add'}
        </Button>
      </form>
    </Form>
  );
}
