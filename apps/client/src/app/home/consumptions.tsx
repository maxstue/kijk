import * as dashboardOptions from '@kijk/api/dashboard/options';
import { Card, CardHeader } from '@kijk/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { AnnualChart, type AnnualSeries } from './annual-chart';
import { months } from './constants';
import { Section } from './section';

interface Props {
  spaceId: string;
  year: number;
  month: number;
}
const colors = [
  'var(--color-teal-500)',
  'var(--color-blue-500)',
  'var(--color-violet-500)',
  'var(--color-amber-500)',
  'var(--color-rose-500)',
];

/** All recorded resources are shown. Each unit has its own scale; values are never added across resources. */
export function Consumptions({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.consumptionsQueryOptions(spaceId, year));
  const canView = useSpacePermission('consumptions:view');
  const resources = [
    ...new Map(
      query.data?.map((item) => [
        item.resourceId,
        { id: item.resourceId, name: item.name ?? '', unit: item.unit ?? '' },
      ]) ?? [],
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id)));
  const units = [...new Set(resources.map((resource) => resource.unit))];
  const series = resources.map((resource, index) => ({
    ...resource,
    color: colors[index % colors.length],
    label: resource.name,
    values: months.map((_, monthIndex) => {
      const row = query.data?.find((item) => item.resourceId === resource.id && item.month === monthIndex + 1);
      return row ? Number(row.value) : null;
    }),
  }));
  return (
    <Section
      title='Consumptions'
      description='All resources. Monthly totals and yearly trends.'
      pending={query.isPending}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      {resources.length === 0 ? (
        <p className='text-muted-foreground'>No consumption data for this year.</p>
      ) : (
        <>
          <dl className='grid grid-cols-2 gap-3 @xl/home:grid-cols-3'>
            {series.map((resource) => (
              <Card key={resource.id} size='sm' className='bg-muted/20 min-w-0 shadow-none ring-0'>
                <CardHeader>
                  <dt className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <span className='size-2 shrink-0 rounded-full' style={{ background: resource.color }} />
                    {resource.name}
                  </dt>
                  <dd
                    className={
                      resource.values[month - 1] == null
                        ? 'text-muted-foreground text-sm'
                        : 'text-2xl font-semibold tracking-tight tabular-nums'
                    }
                  >
                    {resource.values[month - 1] == null
                      ? 'No readings this month'
                      : `${resource.values[month - 1]?.toLocaleString()} ${resource.unit}`}
                  </dd>
                  <p className='text-muted-foreground text-xs'>
                    {months[month - 1]} {year}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </dl>
          <h3 className='text-sm font-medium'>Consumption over the year</h3>
          <div className={units.length > 1 ? 'grid min-w-0 gap-6 @3xl/home:grid-cols-2' : 'grid min-w-0 gap-6'}>
            {units.map((unit) => (
              <div
                key={unit}
                className='flex min-w-0 flex-col gap-3'
                role='group'
                aria-label={`Consumption history in ${unit}`}
              >
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <h3 className='text-sm font-medium'>
                    {year} · {unit}
                  </h3>
                  <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                    {series
                      .filter((resource) => resource.unit === unit)
                      .map((resource) => (
                        <span key={resource.id} className='flex items-center gap-1.5'>
                          <span className='size-2 rounded-full' style={{ background: resource.color }} />
                          {resource.name}
                        </span>
                      ))}
                  </div>
                </div>
                <AnnualChart
                  year={year}
                  month={month}
                  unit={unit}
                  series={series.filter((resource) => resource.unit === unit) satisfies AnnualSeries[]}
                />
              </div>
            ))}
          </div>
        </>
      )}
      {canView && (
        <Link
          className='text-muted-foreground hover:text-foreground text-sm font-medium'
          to='/$spaceId/consumptions'
          params={{ spaceId }}
        >
          View consumptions →
        </Link>
      )}
    </Section>
  );
}
