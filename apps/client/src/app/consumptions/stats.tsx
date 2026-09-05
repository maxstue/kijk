import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';

import { consumptionsStatsQueryOptions } from '@/shared/api/consumptions/options';
import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Months } from '@/shared/utils/months';
import { getMonthFromDate } from '@/shared/utils/months';

const Route = getRouteApi('/_authenticated/_app/consumptions');

function getComparisonLabel(selectedYear: number, selectedMonth: Months) {
  const now = new Date();
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === getMonthFromDate(now);

  return isCurrentMonth ? 'from last month' : 'compared to current month';
}

export default function ConsumptionStats() {
  const searchParameters = Route.useSearch();

  const selectedYear = searchParameters.year;
  const selectedMonth = searchParameters.month;
  const comparisonLabel = getComparisonLabel(selectedYear, selectedMonth);

  const { data } = useSuspenseQuery(consumptionsStatsQueryOptions(selectedYear, selectedMonth));

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
      {data.stats.length <= 0 ? (
        <p className='text-muted-foreground bg-background rounded-md border border-dashed px-4 py-6 text-sm'>
          No statistics are available for this month yet.
        </p>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {data.stats.map((item) => (
            <Card key={item.resource.name + item.resource.unit + item.yearTotal} className='bg-background shadow-none'>
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
      )}
    </section>
  );
}
