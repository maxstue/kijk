import * as dashboardOptions from '@kijk/api/dashboard/options';
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@kijk/ui/components/card';
import { useQuery } from '@tanstack/react-query';

import { AnnualChart, type AnnualSeries } from './annual-chart';
import { months } from './constants';
import { ConsumptionControls } from './consumption-controls';
import { DashboardSectionContent } from './section-content';
import type { ConsumptionView } from './types';

interface Props {
  spaceId: string;
  year: number;
  month: number;
  resourceId?: string;
  view: ConsumptionView;
  onResourceChange: (resourceId: string) => void;
  onViewChange: (view: ConsumptionView) => void;
}
/** One full-width chart for the selected resource, preserving its unit and configured color. */
export function Consumptions({ spaceId, year, month, resourceId, view, onResourceChange, onViewChange }: Props) {
  const query = useQuery(dashboardOptions.consumptionsQueryOptions(spaceId, year));
  const resources = [
    ...new Map(
      query.data?.map((item) => [
        item.resourceId,
        { id: item.resourceId, name: item.name ?? '', unit: item.unit ?? '', color: item.color ?? 'var(--primary)' },
      ]) ?? [],
    ).values(),
  ].sort((left, right) => left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id)));
  const selected = resources.find((resource) => resource.id === resourceId) ?? resources[0];
  const series: AnnualSeries[] = selected
    ? [
        {
          label: selected.name,
          color: selected.color,
          values: months.map((_, monthIndex) => {
            const row = query.data?.find((item) => item.resourceId === selected.id && item.month === monthIndex + 1);
            const value = view === 'meter' ? row?.meterReading : row?.value;
            return value == null ? null : Number(value);
          }),
        },
      ]
    : [];
  return (
    <Card
      role='region'
      aria-label='Consumptions'
      aria-busy={query.isPlaceholderData}
      className='min-w-0 gap-4 shadow-xs'
    >
      <CardHeader className='min-h-16 has-data-[slot=card-action]:grid-cols-1 @3xl/home:has-data-[slot=card-action]:grid-cols-[1fr_auto]'>
        <CardTitle>Consumptions</CardTitle>
        <CardDescription>{`January–December ${year} · ${view === 'meter' ? 'Month-end meter reading' : 'Monthly consumption'}`}</CardDescription>
        <CardAction className='col-start-1 row-start-3 justify-self-start @3xl/home:col-start-2 @3xl/home:row-start-1 @3xl/home:justify-self-end'>
          <ConsumptionControls
            resources={resources}
            selected={selected}
            view={view}
            onResourceChange={onResourceChange}
            onViewChange={onViewChange}
          />
        </CardAction>
      </CardHeader>
      <DashboardSectionContent pending={query.isPending} error={query.isError} retry={() => void query.refetch()}>
        {!selected ? (
          <p className='text-muted-foreground'>No consumption data for this year.</p>
        ) : (
          <div className='flex min-w-0 flex-col gap-3'>
            <AnnualChart year={year} month={month} unit={selected.unit} series={series} />
            <div className='text-muted-foreground flex justify-center gap-1.5 text-xs'>
              <span className='mt-1 size-2 rounded-sm' style={{ backgroundColor: selected.color }} />
              <span>{selected.name}</span>
              <span>({selected.unit})</span>
            </div>
          </div>
        )}
      </DashboardSectionContent>
    </Card>
  );
}
