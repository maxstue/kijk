import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { budgetSchema } from '@/app/budgets/schemas';
import type { BudgetFormValues } from '@/app/budgets/schemas';
import { useSaveBudget } from '@/app/budgets/use-save-budget';
import { budgetsQueryOptions } from '@/shared/api/budgets/options';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';
import { FormSwitchItem } from '@/shared/components/form-switch-item';
import { type Visibility, VisibilitySelect } from '@/shared/components/visibility-select';
import { useActiveSpace } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatMonthYear } from '@/shared/utils/months';

interface Props {
  /** Preselects and locks the category when editing an existing budget. */
  categoryId?: string;
  initialAmount?: number;
  /** Preselects shared or private when editing an existing budget. */
  initialVisibility?: Visibility;
  /** The month (1-12) from which the budget applies. */
  month: number;
  onClose: () => void;
  year: number;
}

/** Form that sets the monthly budget of an expense category from the selected month on. */
export function BudgetForm({ categoryId, initialAmount, initialVisibility, month, onClose, year }: Props) {
  const canPlan = useSpacePermission(SpacePermissions.budgets.plan);
  const isPersonalSpace = useActiveSpace()?.isPersonal ?? false;
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const { data: budgets } = useSuspenseQuery(budgetsQueryOptions());
  const saveMutation = useSaveBudget();
  const expenseCategories = categories.filter((category) => category.kind === 'Expense');
  const monthLabel = formatMonthYear(year, month);
  const form = useForm<BudgetFormValues>({
    defaultValues: {
      active: true,
      amount: initialAmount ?? 0,
      categoryId: categoryId ?? '',
      visibility: initialVisibility ?? (canPlan ? 'Shared' : 'Private'),
    },
    resolver: zodResolver(budgetSchema),
  });

  function onSubmit(values: BudgetFormValues) {
    saveMutation.mutate(
      { budgets, month, values, year },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => {
          toast.success('Budget saved');
          onClose();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form className='grid gap-4' onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name='categoryId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select disabled={Boolean(categoryId)} value={field.value} onValueChange={field.onChange}>
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
        <FormField
          control={form.control}
          name='amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly amount (EUR)</FormLabel>
              <FormControl>
                <Input
                  min='0'
                  step='0.01'
                  type='number'
                  {...field}
                  onChange={(event) => field.onChange(event.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>Applies from {monthLabel} until you change it again.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isPersonalSpace && (
          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who uses this budget</FormLabel>
                <VisibilitySelect canShare={canPlan} value={field.value} onChange={field.onChange} />
                <FormDescription>
                  A private budget replaces the shared one of this category for you only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name='active'
          render={({ field }) => (
            <FormSwitchItem
              checked={field.value}
              description='Paused budgets are not evaluated.'
              label='Active'
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Button className='mt-2' disabled={saveMutation.isPending} type='submit'>
          {saveMutation.isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Save budget'}
        </Button>
      </form>
    </Form>
  );
}
