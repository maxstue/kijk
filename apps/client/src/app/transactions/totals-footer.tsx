import { TableCell, TableFooter, TableRow } from '@kijk/ui/components/table';
import { cn } from 'cn';

import { formatStringToCurrency } from '@/shared/utils/format';

interface TotalsFooterProps {
  incoming: number;
  /** Number of columns left of the amount column. */
  labelColumns: number;
  outgoing: number;
  totalCount: number;
}

/** Sums of all transactions matching the filters, across every page. */
export function TotalsFooter({ incoming, labelColumns, outgoing, totalCount }: TotalsFooterProps) {
  const net = incoming + outgoing;

  return (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={labelColumns}>
          <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
            <span className='font-medium'>
              Total · {totalCount} {totalCount === 1 ? 'transaction' : 'transactions'}
            </span>
            <span className='text-muted-foreground text-xs font-normal'>
              <span className='text-emerald-600'>{formatStringToCurrency(incoming)}</span> in ·{' '}
              {formatStringToCurrency(outgoing)} out
            </span>
          </div>
        </TableCell>
        <TableCell className={cn('text-right font-semibold whitespace-nowrap', net > 0 && 'text-emerald-600')}>
          {formatStringToCurrency(net)}
        </TableCell>
        <TableCell />
      </TableRow>
    </TableFooter>
  );
}
