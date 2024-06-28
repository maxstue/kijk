import { useMemo } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { useGetTransactionsBy } from '@/app/budget/use-get-transations-by';
import { DataTable } from '@/shared/components/data-table';

const Route = getRouteApi('/_protected/budget');

export function BudgetMonthOverview() {
  const searchParams = Route.useSearch();

  const { data } = useGetTransactionsBy(searchParams.year, searchParams.month);
  const transactions = useMemo(() => data?.data ?? [], [data?.data]);

  return <DataTable data={transactions} columns={budgetColumns} defaultSort={budgetDefaultSort} />;
}
