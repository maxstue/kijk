import * as dashboardOptions from '@kijk/api/dashboard/options';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { Section } from './section';
import { ThresholdItem } from './threshold-item';

interface Props {
  spaceId: string;
  year: number;
  month: number;
}

export function Limits({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.limitsQueryOptions(spaceId, year, month));
  const canView = useSpacePermission('limits:view');
  const start = new Date(Date.UTC(year, month - 1, 1)).getTime();
  const end = new Date(Date.UTC(year, month, 1)).getTime();
  const critical = (query.data ?? [])
    .filter(
      (item) =>
        new Date(item.periodStart ?? '').getTime() === start &&
        new Date(item.periodEnd ?? '').getTime() === end &&
        (Number(item.percentage) >= 80 || Number(item.overrun) > 0 || Number(item.remaining) === 0),
    )
    .sort((left, right) => {
      const urgency = (item: typeof left) =>
        Number(item.threshold) === 0 && Number(item.actualValue) > 0
          ? Number.POSITIVE_INFINITY
          : Number(item.percentage ?? 0);
      return (
        urgency(right) - urgency(left) ||
        String(left.name).localeCompare(String(right.name)) ||
        String(left.id).localeCompare(String(right.id))
      );
    })
    .slice(0, 5);

  return (
    <Section
      title='Limits'
      description='Top 5 monthly consumption limits at 80% or above.'
      pending={query.isPending}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      {critical.length === 0 ? (
        <p>No monthly limits close to their threshold.</p>
      ) : (
        critical.map((item) => (
          <ThresholdItem
            key={item.id}
            name={item.name ?? ''}
            actual={Number(item.actualValue)}
            threshold={Number(item.threshold)}
            unit={item.unit ?? ''}
            percentage={item.percentage == null ? null : Number(item.percentage)}
            remaining={Number(item.remaining)}
            overrun={Number(item.overrun)}
          />
        ))
      )}
      {canView && (
        <Link
          className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
          to='/$spaceId/consumptions/limits'
          params={{ spaceId }}
        >
          View all limits
        </Link>
      )}
    </Section>
  );
}
