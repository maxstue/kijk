import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Tags, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { categorySchema } from '@/app/budgets/schemas';
import type { CategoryFormValues } from '@/app/budgets/schemas';
import { useCreateCategory, useDeleteCategory } from '@/app/budgets/use-category-mutations';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { ResourceIcon } from '@/shared/components/resource-icon';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

const customCategoryIcon = 'tag';

/** Dialog listing all categories, with creating and deleting the household's own categories. */
export function CategoriesDialog() {
  const canConfigure = useHouseholdPermission(HouseholdPermissions.finances.configure);
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const deleteMutation = useDeleteCategory();

  function onDelete(id: string) {
    deleteMutation.mutate(id, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Category deleted'),
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Tags /> Categories
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            Default categories are available to every household; add your own on top.
          </DialogDescription>
        </DialogHeader>
        <ul className='divide-y'>
          {categories.map((category) => (
            <li key={category.id} className='flex items-center justify-between gap-3 py-2'>
              <span className='flex items-center gap-2'>
                <ResourceIcon className='size-4' color={category.color} name={category.icon} />
                {category.name}
                <span className='text-muted-foreground text-xs'>{category.kind}</span>
              </span>
              {category.creatorType === 'User' && (
                <Button
                  aria-label={`Delete ${category.name}`}
                  disabled={!canConfigure || deleteMutation.isPending}
                  size='icon-sm'
                  variant='ghost'
                  onClick={() => onDelete(category.id)}
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {canConfigure && (
          <>
            <Separator />
            <CreateCategoryForm />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateCategoryForm() {
  const createMutation = useCreateCategory();
  const form = useForm<CategoryFormValues>({
    defaultValues: { color: '#64748b', kind: 'Expense', name: '' },
    resolver: zodResolver(categorySchema),
  });

  function onSubmit(values: CategoryFormValues) {
    createMutation.mutate(
      { ...values, icon: customCategoryIcon },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => {
          toast.success('Category created');
          form.reset();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        className='grid gap-3 sm:grid-cols-[1fr_8rem_4rem_auto] sm:items-end'
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New category</FormLabel>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='Expense'>Expense</SelectItem>
                  <SelectItem value='Income'>Income</SelectItem>
                </SelectContent>
              </Select>
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
            </FormItem>
          )}
        />
        <Button disabled={createMutation.isPending} type='submit'>
          Add
        </Button>
      </form>
    </Form>
  );
}
