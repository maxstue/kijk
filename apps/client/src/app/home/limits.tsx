import * as dashboardOptions from '@kijk/api/dashboard/options';
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
    <Section title='Limits' pending={query.isPending} error={query.isError} retry={() => void query.refetch()}>
      <p className='text-muted-foreground text-sm'>Current active limit definitions applied to the selected period.</p>
      {query.data?.length === 0 ? (
        <p>No active limits.</p>
      ) : (
        query.data?.map((item) => (
          <article key={item.id} className='space-y-2 border-b pb-4'>
            <h3 className='font-medium'>{item.name}</h3>
            <p>
              {item.periodStart?.slice(0, 10)} –{' '}
              {item.periodEnd ? new Date(new Date(item.periodEnd).getTime() - 86400000).toISOString().slice(0, 10) : ''}
            </p>
            <p>
              {item.actualValue?.toLocaleString()} / {item.threshold?.toLocaleString()} {item.unit}
            </p>
            {item.percentage != null && (
              <>
                <progress
                  className='w-full'
                  value={Math.min(100, Number(item.percentage))}
                  max={100}
                  aria-label={`${item.name} utilization`}
                />
                <p>{item.percentage.toLocaleString()} %</p>
              </>
            )}
            <p>
              {Number(item.overrun) > 0
                ? `Exceeded by ${item.overrun?.toLocaleString()}`
                : Number(item.remaining) === 0
                  ? 'Limit reached'
                  : `${item.remaining?.toLocaleString()} remaining`}{' '}
              {item.unit}
            </p>
          </article>
        ))
      )}
      {canView && (
        <Link className='underline' to='/$spaceId/consumptions/limits' params={{ spaceId }}>
          View limits
        </Link>
      )}
    </Section>
  );
}
