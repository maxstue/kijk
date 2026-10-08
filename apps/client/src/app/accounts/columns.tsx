import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import type { ColumnDef, ColumnSort } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { AccountRowActions } from '@/app/accounts/row-actions';
import type { AccountPermissions } from '@/app/accounts/types';
import type { Account } from '@/shared/api/accounts/types';
import { PrivateBadge } from '@/shared/components/visibility-select';
import type { DataTableFeatures } from '@/shared/lib/table-features';

/** Default sorting of the account table (by name). */
export const accountDefaultSort: ColumnSort = { desc: false, id: 'name' };

/** Columns of the account table; `permissions` decide which management actions are enabled. */
export const getAccountColumns = (permissions: AccountPermissions): Array<ColumnDef<DataTableFeatures, Account>> => [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span>{row.original.name}</span>
        {row.original.visibility === 'Private' && !permissions.isPersonalSpace && <PrivateBadge />}
      </div>
    ),
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    accessorKey: 'ibanLast4',
    cell: ({ row }) =>
      row.original.ibanLast4 ? (
        <span className='font-mono'>…{row.original.ibanLast4}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
    header: 'IBAN',
  },
  {
    accessorKey: 'kind',
    cell: ({ row }) => (
      <Badge variant={row.original.kind === 'Cash' ? 'secondary' : 'outline'}>
        {row.original.kind === 'Cash' ? 'Cash' : 'Bank'}
      </Badge>
    ),
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Kind
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
  },
  {
    cell: ({ row }) => <AccountRowActions permissions={permissions} row={row} />,
    id: 'actions',
  },
];
