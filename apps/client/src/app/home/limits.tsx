import * as dashboardOptions from '@kijk/api/dashboard/options';
import { Card, CardHeader, CardTitle, CardDescription } from '@kijk/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { DashboardSectionContent } from './section-content';
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
    .filter((item) => {
      const periodStart = new Date(item.periodStart ?? '');
      const periodEnd = new Date(item.periodEnd ?? '').getTime();
      const monthlyEnd = Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1);
      const matchesMonth = query.isPlaceholderData || (periodStart.getTime() === start && periodEnd === end);
      return (
        periodEnd === monthlyEnd &&
        matchesMonth &&
        (Number(item.percentage) >= 80 || Number(item.overrun) > 0 || Number(item.remaining) === 0)
      );
    })
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
    .slice(0, 3);

  return (
    <Card role='region' aria-label='Limits' aria-busy={query.isPlaceholderData} className='min-w-0 gap-4 shadow-xs'>
      <CardHeader className='min-h-16 has-data-[slot=card-action]:grid-cols-1 @3xl/home:has-data-[slot=card-action]:grid-cols-[1fr_auto]'>
        <CardTitle>Limits</CardTitle>
        <CardDescription>Top 3 monthly consumption limits at 80% or above.</CardDescription>
      </CardHeader>
      <DashboardSectionContent
        size='list'
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
      </DashboardSectionContent>
    </Card>
  );
}
