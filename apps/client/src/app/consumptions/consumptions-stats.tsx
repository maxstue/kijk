import { getRouteApi } from '@tanstack/react-router';

import { ResourceUnit } from '@/app/consumptions/resources-unit.tsx';
import { useGetConsumptionsStats } from '@/app/consumptions/use-get-consumptions-stats.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const Route = getRouteApi('/_protected/consumptions');

export default function ConsumptionsStats() {
  const searchParameters = Route.useSearch();

  const selectedYear = searchParameters.year;
  const selectedMonth = searchParameters.month;

  const { data } = useGetConsumptionsStats(selectedYear, selectedMonth);

  // TODO show specific icon for each resource type
  //  l = water
  //  kwh = electricity
  //  m3 = gas
  //  default = ???

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
            <Card key={item.type.name + item.type.unit + item.yearTotal}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{item.type.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {item.monthTotal} <ResourceUnit type={item.type} />
                </div>
                <p className='text-muted-foreground text-xs'>{item.comparisonMonthDiff} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : undefined}
    </>
  );
}
