import { createBudget, updateBudget } from '@kijk/api/budgets/requests';
import type { Budget } from '@kijk/api/budgets/types';
import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { useMutation } from '@tanstack/react-query';

import { findBudgetStartingIn, toMonthStart } from '@/app/budgets/helpers';
import type { BudgetFormValues } from '@/app/budgets/schemas';

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
  return useMutation({
    mutationFn: ({ budgets, month, values, year }: SaveBudgetData) => {
      const existing = findBudgetStartingIn(budgets, values.categoryId, year, month, values.visibility);
      return existing
        ? updateBudget({ budget: { active: values.active, amount: values.amount }, id: existing.id })
        : createBudget({ ...values, validFrom: toMonthStart(year, month) });
    },
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.budgets.all),
  });
}
