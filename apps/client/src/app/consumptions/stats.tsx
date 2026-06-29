import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';

import { consumptionsStatsQueryOptions } from '@/shared/api/consumptions/options';
import { ResourceUnit } from '@/shared/components/resources-unit';
import type { Months } from '@/shared/utils/months';
import { getMonthFromDate } from '@/shared/utils/months';

const Route = getRouteApi('/_protected/consumptions');

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
    <>
      {data.stats.length <= 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              No data available to show statistics for{' '}
              <span className='font-bold'>
                {selectedMonth} {selectedYear}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : undefined}
      {data.stats.length > 0 ? (
        <div className='grid gap-4 lg:grid-cols-4'>
          {data.stats.map((item) => (
            <Card key={item.resource.name + item.resource.unit + item.yearTotal}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{item.resource.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {item.monthTotal} <ResourceUnit type={item.resource} />
                </div>
                <p className='text-muted-foreground text-xs'>
                  {item.comparisonMonthDiff} {comparisonLabel}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : undefined}
    </>
  );
}
