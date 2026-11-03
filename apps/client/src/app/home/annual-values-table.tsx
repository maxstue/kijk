import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';

import { months } from './constants';
import type { AnnualSeries } from './types';
interface AnnualValuesTableProps {
  groups: AnnualSeries[];
  year: number;
  month: number;
  unit: string;
  now: Date;
}
export function AnnualValuesTable({ groups, year, month, unit, now }: AnnualValuesTableProps) {
  return (
    <div className='sr-only'>
      <Table className='mt-3 text-xs'>
        <caption>Monthly values · {year}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            {groups.map((group) => (
              <TableHead key={group.label} className='text-right'>
                {group.label} ({unit})
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((label, index) => (
            <TableRow key={label} className={index + 1 === month ? 'bg-muted/60' : ''}>
              <TableHead scope='row'>{label}</TableHead>
              {groups.map((group) => {
                const future = year > now.getFullYear() || (year === now.getFullYear() && index > now.getMonth());
                let value = 'No data';
                if (future) {
                  value = 'Upcoming';
                } else if (group.values[index] != null) {
                  value = group.values[index].toLocaleString();
                }
                return (
                  <TableCell key={group.label} className='text-right tabular-nums'>
                    {value}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
