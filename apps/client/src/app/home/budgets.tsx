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

export function Budgets({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.budgetsQueryOptions(spaceId, year, month));
  const canView = useSpacePermission('finances:view');
  return (
    <Card role='region' aria-label='Budgets' aria-busy={query.isPlaceholderData} className='min-w-0 gap-4 shadow-xs'>
      <CardHeader className='min-h-16 has-data-[slot=card-action]:grid-cols-1 @3xl/home:has-data-[slot=card-action]:grid-cols-[1fr_auto]'>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>Top 3 shared monthly budgets by utilization.</CardDescription>
      </CardHeader>
      <DashboardSectionContent
        size='list'
        pending={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      >
        {query.data?.length ? (
          query.data
            .slice(0, 3)
            .map((item) => (
              <ThresholdItem
                key={item.id}
                name={item.name ?? ''}
                actual={Number(item.spent)}
                threshold={Number(item.amount)}
                unit={item.currency ?? 'EUR'}
                percentage={item.percentage == null ? null : Number(item.percentage)}
                remaining={Number(item.remaining)}
                overrun={Number(item.overrun)}
              />
            ))
        ) : (
          <p>No shared budgets for this month.</p>
        )}
        {canView && (
          <Link
            className='text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            to='/$spaceId/finances/budgets'
            params={{ spaceId }}
          >
            View all budgets
          </Link>
        )}
      </DashboardSectionContent>
    </Card>
  );
}
