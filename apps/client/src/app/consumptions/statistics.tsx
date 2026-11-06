import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Suspense } from 'react';

import { ResourceUnit } from '@/shared/components/resources-unit';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import type { Months } from '@/shared/utils/months';
import { getMonthFromDate } from '@/shared/utils/months';

const Route = getRouteApi('/_authenticated/_app/$spaceId/consumptions/_overview');

interface ConsumptionStatsProps {
  resourceCount: number;
}

interface ConsumptionStatsContentProps {
  year: number;
  month: Months;
}

function getComparisonLabel(selectedYear: number, selectedMonth: Months) {
  const now = new Date();
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === getMonthFromDate(now);

  return isCurrentMonth ? 'from last month' : 'compared to current month';
}

/** Monthly overview cards with totals and comparisons for every resource. */
export default function ConsumptionStats({ resourceCount }: ConsumptionStatsProps) {
  const searchParameters = Route.useSearch();

  const selectedYear = searchParameters.year;
  const selectedMonth = searchParameters.month;

  return (
    <section aria-labelledby='monthly-overview-heading' className='bg-muted/30 space-y-4 rounded-lg border p-4 sm:p-6'>
      <div className='space-y-1'>
        <h3 id='monthly-overview-heading' className='text-lg font-semibold tracking-tight'>
          Monthly overview
        </h3>
        <p className='text-muted-foreground text-sm'>
          Totals by resource type for {selectedMonth} {selectedYear}.
        </p>
      </div>
      <Suspense fallback={<ConsumptionStatsSkeleton resourceCount={resourceCount} />}>
        <ConsumptionStatsContent year={selectedYear} month={selectedMonth} />
      </Suspense>
    </section>
  );
}

function ConsumptionStatsSkeleton({ resourceCount }: ConsumptionStatsProps) {
  return (
    <div>
      <output className='sr-only' aria-label='Loading monthly overview'>
        Loading monthly overview
      </output>
      <div aria-hidden='true' className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: Math.max(resourceCount, 1) }, (_, index) => (
          <Card key={index} className='bg-background shadow-none'>
            <CardHeader className='flex flex-row items-center gap-2 space-y-0 pb-2'>
              <Skeleton className='size-2.5 shrink-0 rounded-full' />
              <div className='flex h-[21px] items-center'>
                <Skeleton className='h-4 w-24' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex h-8 items-center'>
                <Skeleton className='h-6 w-20' />
              </div>
              <div className='flex h-4 items-center'>
                <Skeleton className='h-3 w-12' />
              </div>
              <div className='mt-1 flex h-4 items-center'>
                <Skeleton className='h-3 w-44 max-w-full' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConsumptionStatsContent({ year, month }: ConsumptionStatsContentProps) {
  const spaceId = useSpaceId();
  const { data } = useSuspenseQuery(consumptionsOptions.statisticsQueryOptions(spaceId, year, month));
  const comparisonLabel = getComparisonLabel(year, month);

  return data.stats.length <= 0 ? (
    <p className='text-muted-foreground bg-background rounded-md border border-dashed px-4 py-6 text-sm'>
      No statistics are available for this month yet.
    </p>
  ) : (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {data.stats.map((item) => (
        <Card key={item.resource.id} className='bg-background shadow-none'>
          <CardHeader className='flex flex-row items-center gap-2 space-y-0 pb-2'>
            <span
              aria-hidden='true'
              className='size-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: item.resource.color }}
            />
            <CardTitle className='text-sm font-medium'>{item.resource.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-semibold tabular-nums'>
              {item.monthTotal} <ResourceUnit type={item.resource} />
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {item.comparisonMonthDiff} {comparisonLabel}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
