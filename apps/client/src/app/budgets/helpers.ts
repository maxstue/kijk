import type { Budget } from '@/shared/api/budgets/types';

/** Formats a month (1-12) as the ISO date of its first day, e.g. `2026-10-01`. */
export function toMonthStart(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/**
 * Returns the budget version of a category that starts exactly in the given month, if any. Shared and private budgets
 * are separate versions.
 */
export function findBudgetStartingIn(
  budgets: Budget[],
  categoryId: string,
  year: number,
  month: number,
  visibility: Budget['visibility'] = 'Shared',
) {
  const monthStart = toMonthStart(year, month);
  return budgets.find(
    (budget) => budget.categoryId === categoryId && budget.validFrom === monthStart && budget.visibility === visibility,
  );
}

/** Converts an API decimal, which may be serialized as a string, to a number. */
export function toAmount(value: number | string | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}
