import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown, Sparkles } from 'lucide-react';

import { CategoryRuleRowActions } from '@/app/categories/rule-row-actions';
import { categoryRulesQueryOptions } from '@/shared/api/category-rules/options';
import type { CategoryRule } from '@/shared/api/category-rules/types';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { DataTable } from '@/shared/components/data-table';
import { PrivateBadge } from '@/shared/components/visibility-select';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import type { DataTableFeatures } from '@/shared/lib/table-features';

const ruleScopeLabels: Record<CategoryRule['scope'], string> = {
  Counterparty: 'Counterparty account',
  Keyword: 'Purpose contains this word',
  Merchant: 'Merchant name',
};

const ruleDefaultSort: ColumnSort = { desc: false, id: 'label' };

const getRuleColumns = (canRecord: boolean): Array<ColumnDef<DataTableFeatures, CategoryRule>> => [
  {
    accessorKey: 'label',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span>{row.original.label || 'Unnamed'}</span>
        {row.original.visibility === 'Private' && <PrivateBadge />}
      </div>
    ),
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Matches
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'scope',
    cell: ({ row }) => <span className='text-muted-foreground'>{ruleScopeLabels[row.original.scope]}</span>,
    header: 'Matched on',
  },
  {
    accessorKey: 'categoryName',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Category
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    cell: ({ row }) => <CategoryRuleRowActions canRecord={canRecord} row={row} />,
    id: 'actions',
  },
];

/** Remembered category corrections that imports apply automatically, with deleting them. */
export function CategoryRulesSection() {
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const { data: rules } = useSuspenseQuery(categoryRulesQueryOptions());
  const columns = getRuleColumns(canRecord);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Categorization rules</h3>
        <p className='text-muted-foreground text-sm'>
          Imports give these merchants and counterparties their category automatically. Corrections you make by hand
          always win. To add a rule, change a transaction&apos;s category and choose “Remember”.
        </p>
      </div>
      <Card className='min-w-32'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Rules</CardTitle>
          <Sparkles className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='mt-2'>
            <DataTable
              columns={columns}
              data={rules}
              defaultSort={ruleDefaultSort}
              filterColumn='label'
              filterPlaceholder='Filter matches...'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
