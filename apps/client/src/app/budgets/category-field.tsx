import * as categoriesOptions from '@kijk/api/categories/options';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Control } from 'react-hook-form';

import type { BudgetFormValues } from '@/app/budgets/schemas';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { useSpaceId } from '@/shared/hooks/use-active-space';
interface BudgetCategoryFieldProps {
  control: Control<BudgetFormValues>;
  categoryId?: string;
}
export function BudgetCategoryField({ control, categoryId }: BudgetCategoryFieldProps) {
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));
  const expenseCategories = categories.filter((category) => category.kind === 'Expense');
  return (
    <FormField
      control={control}
      name='categoryId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select
            disabled={Boolean(categoryId)}
            items={expenseCategories.map((category) => ({ label: category.name, value: category.id }))}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
