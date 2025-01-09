import { useMemo } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { budgetColumns, budgetDefaultSort } from '@/app/budget/budget-column';
import { useGetTransactionsBy } from '@/app/budget/use-get-transactions-by';
import { DataTable } from '@/shared/components/data-table';

const Route = getRouteApi('/_protected/energy');

export function EnergyMonthTable() {
  const searchParameters = Route.useSearch();

  const { data } = useGetTransactionsBy(searchParameters.year, searchParameters.month);
  const transactions = useMemo(() => data ?? [], [data]);

  return <DataTable columns={budgetColumns} data={transactions} defaultSort={budgetDefaultSort} />;
}
