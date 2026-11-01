import * as dashboardOptions from '@kijk/api/dashboard/options';
import { useQuery } from '@tanstack/react-query';

import { AnnualChart, type AnnualSeries } from './annual-chart';
import { months } from './constants';
import { Section } from './section';

interface Props {
  spaceId: string;
  year: number;
  month: number;
}
const colors = [
  'var(--color-blue-400)',
  'var(--color-blue-600)',
  'var(--color-violet-500)',
  'var(--color-amber-500)',
  'var(--color-rose-500)',
];

/** All recorded resources are shown. Each unit has its own scale; values are never added across resources. */
export function Consumptions({ spaceId, year, month }: Props) {
  const query = useQuery(dashboardOptions.consumptionsQueryOptions(spaceId, year));
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
      description={`January–December ${year}`}
      pending={query.isPending}
      updating={query.isPlaceholderData}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      {resources.length === 0 ? (
        <p className='text-muted-foreground'>No consumption data for this year.</p>
      ) : (
        <>
          <div className={units.length > 1 ? 'grid min-w-0 gap-6 @3xl/home:grid-cols-2' : 'grid min-w-0 gap-6'}>
            {units.map((unit) => (
              <div
                key={unit}
                className='flex min-w-0 flex-col gap-3'
                role='group'
                aria-label={`Consumption history in ${unit}`}
              >
                <AnnualChart
                  year={year}
                  month={month}
                  unit={unit}
                  series={series.filter((resource) => resource.unit === unit) satisfies AnnualSeries[]}
                />
                <div className='text-muted-foreground flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs'>
                  {series
                    .filter((resource) => resource.unit === unit)
                    .map((resource) => (
                      <span key={resource.id} className='flex items-center gap-1.5'>
                        <span className='size-2 rounded-sm' style={{ background: resource.color }} />
                        <span>{resource.name}</span>
                        <span>({resource.unit})</span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
