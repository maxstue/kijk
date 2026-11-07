import { SpacePermissions } from '@kijk/api/spaces/permissions';
import type { Transaction } from '@kijk/api/transactions/types';
import { Badge } from '@kijk/ui/components/badge';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { TableCell, TableRow } from '@kijk/ui/components/table';
import { cn } from 'cn';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

import { CategorySelect } from './category-select';
import { EditButton, DeleteButton } from './row-actions';

interface TransactionRowProps {
  selection?: { checked: boolean; onChange: (checked: boolean) => void };
  transaction: Transaction;
}

export function TransactionRow({ selection, transaction }: TransactionRowProps) {
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const amount = Number(transaction.amount);

  return (
    <TableRow>
      {selection && (
        <TableCell>
          <Checkbox
            aria-label='Select transaction'
            checked={selection.checked}
            onCheckedChange={(checked) => selection.onChange(checked === true)}
          />
        </TableCell>
      )}
      <TableCell className='whitespace-nowrap'>
        {new Date(`${transaction.bookingDate}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}
      </TableCell>
      <TableCell>
        <div className='font-medium'>{transaction.counterparty ?? '—'}</div>
        {transaction.purpose && (
          <div className='text-muted-foreground max-w-80 truncate text-xs'>{transaction.purpose}</div>
        )}
        <div className='mt-1 flex flex-wrap gap-1'>
          {transaction.status === 'Pending' && <Badge variant='outline'>Pending</Badge>}
          {transaction.isTransfer && <Badge variant='outline'>Transfer</Badge>}
          {transaction.accountName && <Badge variant='secondary'>{transaction.accountName}</Badge>}
        </div>
      </TableCell>
      <TableCell>
        <CategorySelect disabled={!canRecord} transaction={transaction} />
      </TableCell>
      <TableCell className={cn('text-right font-medium whitespace-nowrap', amount > 0 && 'text-emerald-600')}>
        {formatStringToCurrency(amount)}
      </TableCell>
      <TableCell>
        <div className='flex justify-end gap-1'>
          <EditButton disabled={!canRecord} transaction={transaction} />
          <DeleteButton disabled={!canRecord} transaction={transaction} />
        </div>
      </TableCell>
    </TableRow>
  );
}
