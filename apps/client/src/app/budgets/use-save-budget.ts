import { useMutation, useQueryClient } from '@tanstack/react-query';

import { findBudgetStartingIn, toMonthStart } from '@/app/budgets/helpers';
import type { BudgetFormValues } from '@/app/budgets/schemas';
import { createBudget, updateBudget } from '@/shared/api/budgets/requests';
import type { Budget } from '@/shared/api/budgets/types';
import { queryKeys } from '@/shared/api/query-keys';

interface SaveBudgetData {
  budgets: Budget[];
  month: number;
  values: BudgetFormValues;
  year: number;
}

/**
 * Sets the budget of a category from the given month on. Changes the version starting in that month if there is one,
 * otherwise starts a new version so earlier months keep their budget.
 */
export function useSaveBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgets, month, values, year }: SaveBudgetData) => {
      const existing = findBudgetStartingIn(budgets, values.categoryId, year, month);
      return existing
        ? updateBudget({ budget: { active: values.active, amount: values.amount }, id: existing.id })
        : createBudget({ ...values, validFrom: toMonthStart(year, month) });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
}
