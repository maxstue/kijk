import type { Limit } from '@kijk/api/limits/types';
import { Badge } from '@kijk/ui/components/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Progress } from '@kijk/ui/components/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { cn } from 'cn';

import { LimitActions } from './actions';
import type { LimitActionsProps, LimitsViewProps } from './types';

/** Compact comparison with responsive details and the same actions as the cards. */
export function LimitsList({ limits, canPlan, onAction }: LimitsViewProps) {
  return (
    <div className='min-w-0 rounded-xl border'>
      <Table aria-label='Consumption limits'>
        <TableHeader>
          <TableRow>
            <TableHead className='px-4'>Limit</TableHead>
            <TableHead className='hidden sm:table-cell'>Consumption</TableHead>
            <TableHead className='px-4 text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limits.map((limit) => (
            <TableRow key={limit.id}>
              <TableCell className='max-w-0 px-4 py-4 whitespace-normal sm:w-1/3'>
                <div className='flex min-w-0 flex-col items-start gap-2'>
                  <span className='w-full truncate font-medium' title={limit.name}>
                    {limit.name}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {limit.resource.name} · {limit.period}
                  </span>
                  <LimitStatus limit={limit} />
                  <div className='w-full sm:hidden'>
                    <LimitUsage limit={limit} />
                  </div>
                </div>
              </TableCell>
              <TableCell className='hidden py-4 sm:table-cell'>
                <div className='max-w-xs'>
                  <LimitUsage limit={limit} />
                </div>
              </TableCell>
              <TableCell className='w-px px-4 py-4'>
                <LimitActions limit={limit} canPlan={canPlan} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Card layout for inspecting individual limits. */
export function LimitsGrid({ limits, canPlan, onAction }: LimitsViewProps) {
  return (
    <ul aria-label='Consumption limits' className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {limits.map((limit) => (
        <li key={limit.id} className='min-w-0'>
          <LimitCard limit={limit} canPlan={canPlan} onAction={onAction} />
        </li>
      ))}
    </ul>
  );
}

function LimitCard({ limit, canPlan, onAction }: LimitActionsProps) {
  return (
    <Card
      className={cn(
        'h-full min-w-0 transition-shadow hover:shadow-md',
        limit.isExceeded && limit.active && 'border-destructive',
      )}
    >
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-col gap-2'>
            <CardTitle className='truncate' title={limit.name}>
              {limit.name}
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              {limit.resource.name} · {limit.period}
            </p>
          </div>
          <LimitStatus limit={limit} />
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <LimitUsage limit={limit} />
        {limit.description && <p className='text-muted-foreground text-sm'>{limit.description}</p>}
      </CardContent>
      <CardFooter className='border-t pt-4'>
        <LimitActions limit={limit} canPlan={canPlan} onAction={onAction} />
      </CardFooter>
    </Card>
  );
}

interface LimitDetailsProps {
  limit: Limit;
}

function LimitStatus({ limit }: LimitDetailsProps) {
  if (!limit.active) {
    return <Badge variant='secondary'>Paused</Badge>;
  }
  if (limit.isExceeded) {
    return <Badge variant='destructive'>Limit reached</Badge>;
  }
  return <Badge variant='secondary'>Active</Badge>;
}

function LimitUsage({ limit }: LimitDetailsProps) {
  const percentage = Number(limit.utilizationPercentage);

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <p className='text-sm tabular-nums'>
        <span className='font-medium'>{Number(limit.actualValue).toLocaleString()}</span>
        <span className='text-muted-foreground'>
          {' '}
          / {Number(limit.limit).toLocaleString()} {limit.resource.unit}
        </span>
      </p>
      <Progress
        aria-label={`${limit.name} utilization`}
        value={Math.min(100, Math.max(0, percentage))}
        className={cn(limit.active && limit.isExceeded && '[&_[data-slot=progress-indicator]]:bg-destructive')}
      />
      <p className='text-muted-foreground text-xs tabular-nums'>
        {percentage.toLocaleString()}% used · {Number(limit.remainingValue).toLocaleString()} remaining
      </p>
    </div>
  );
}
