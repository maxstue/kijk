import * as dashboardOptions from '@kijk/api/dashboard/options';
import { Badge } from '@kijk/ui/components/badge';
import { Progress } from '@kijk/ui/components/progress';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { Section } from './section';

interface Props {
  spaceId: string;
  year: number;
  month: number;
}

export function Limits({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.limitsQueryOptions(spaceId, year, month));
  const canView = useSpacePermission('limits:view');
  return (
    <Section
      title='Limits'
      description='See what is left, reached or over the limit.'
      pending={query.isPending}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      <p className='text-muted-foreground text-xs'>Current limits, evaluated for their full month, quarter or year.</p>
      {query.data?.length === 0 ? (
        <p>No active limits.</p>
      ) : (
        query.data?.map((item) => (
          <article key={item.id} className='border-border/60 flex flex-col gap-3 border-b pb-5 last:border-0 last:pb-0'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='text-sm font-medium'>{item.name}</h3>
              {Number(item.overrun) > 0 && <Badge variant='destructive'>Over limit</Badge>}
            </div>
            <p className='text-muted-foreground text-xs'>
              {item.periodStart?.slice(0, 10)} –{' '}
              {item.periodEnd ? new Date(new Date(item.periodEnd).getTime() - 86400000).toISOString().slice(0, 10) : ''}
            </p>
            <p className='text-lg font-semibold tabular-nums'>
              {item.actualValue?.toLocaleString()} / {item.threshold?.toLocaleString()} {item.unit}
            </p>
            {item.percentage != null && (
              <>
                <Progress
                  className={
                    Number(item.overrun) > 0
                      ? '[&_[data-slot=progress-indicator]]:bg-destructive w-full'
                      : 'w-full [&_[data-slot=progress-indicator]]:bg-teal-500'
                  }
                  value={Math.min(100, Number(item.percentage))}
                  max={100}
                  aria-label={`${item.name} utilization`}
                />
                <p className='text-muted-foreground text-xs font-medium'>{item.percentage.toLocaleString()} %</p>
              </>
            )}
            <p>
              {Number(item.overrun) > 0
                ? `Exceeded by ${item.overrun?.toLocaleString()} ${item.unit}`
                : Number(item.remaining) === 0
                  ? 'Limit reached'
                  : `${item.remaining?.toLocaleString()} ${item.unit} remaining`}
            </p>
          </article>
        ))
      )}
      {canView && (
        <Link
          className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          to='/$spaceId/consumptions/limits'
          params={{ spaceId }}
        >
          View limits
        </Link>
      )}
    </Section>
  );
}
