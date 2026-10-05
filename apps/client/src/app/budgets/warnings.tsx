import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { budgetOverviewQueryOptions } from '@/shared/api/budgets/options';
import { useWarningToasts } from '@/shared/hooks/use-warning-toasts';
import { formatStringToCurrency } from '@/shared/utils/format';

/**
 * Shows a warning toast for every budget exceeded in the given month, with the same logic as consumption limits, and
 * dismisses it once the spending is back within the budget. Renders nothing.
 */
export function BudgetWarnings({ month, year }: { month: number; year: number }) {
  const { data } = useSuspenseQuery(budgetOverviewQueryOptions(year, month));
  const warnings = useMemo(
    () =>
      data.categories
        .filter((category) => category.budget !== null && category.budget !== undefined)
        .map((category) => ({
          active: category.isExceeded,
          description: `${formatStringToCurrency(category.spent)} of ${formatStringToCurrency(category.budget ?? 0)} spent this month.`,
          id: `budget-${category.categoryId}`,
          title: `Budget for ${category.name} exceeded`,
        })),
    [data],
  );

  useWarningToasts(warnings);
  return null;
}
