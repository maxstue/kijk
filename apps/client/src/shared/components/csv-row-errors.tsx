import type { CsvRowError } from '@kijk/api/csv/types';
import { Alert } from '@kijk/ui/components/alert';
import { cn } from 'cn';
import { TriangleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof Alert> {}

interface CsvRowErrorsListProps extends ComponentProps<'details'> {
  rows: CsvRowError[];
  /** The number of all row errors when `rows` only holds a sample. */
  total?: number;
}

/**
 * Alert for rows of an uploaded CSV file that could not be read or imported; compose it with `AlertTitle` and
 * `AlertDescription`.
 */
function CsvRowErrors({ children, ...props }: Props) {
  return (
    <Alert data-slot='csv-row-errors' {...props}>
      <TriangleAlert />
      {children}
    </Alert>
  );
}

/** Collapsible list of the rows by number; `children` replace the default summary text. */
function CsvRowErrorsList({ className, children, rows, total, ...props }: CsvRowErrorsListProps) {
  const hidden = (total ?? rows.length) - rows.length;

  return (
    <details data-slot='csv-row-errors-list' className={cn('mt-1', className)} {...props}>
      <summary className='cursor-pointer'>{children ?? 'Show rows'}</summary>
      <ul className='mt-2 list-disc pl-4'>
        {rows.map((row) => (
          <li key={row.rowNumber}>
            Row {row.rowNumber}: {row.errors}
          </li>
        ))}
        {hidden > 0 && <li>… and {hidden} more</li>}
      </ul>
    </details>
  );
}

export { CsvRowErrors, CsvRowErrorsList };
