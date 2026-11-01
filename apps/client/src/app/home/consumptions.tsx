import * as dashboardOptions from '@kijk/api/dashboard/options';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';
import { useQuery } from '@tanstack/react-query';

import { AnnualChart, type AnnualSeries } from './annual-chart';
import { months } from './constants';
import { Section } from './section';
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
    <Section
      title='Consumptions'
      description={`January–December ${year} · ${view === 'meter' ? 'Month-end meter reading' : 'Monthly consumption'}`}
      action={
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={selected?.id ?? null}
            disabled={resources.length === 0}
            onValueChange={(resourceId) => {
              if (resourceId) {
                onResourceChange(resourceId);
              }
            }}
          >
            <SelectTrigger size='sm' className='w-48 max-w-full' aria-label='Resource'>
              <span
                className='size-2 shrink-0 rounded-full'
                style={{ backgroundColor: selected?.color ?? 'transparent' }}
              />
              <SelectValue className='min-w-0 truncate'>
                {selected ? `${selected.name} (${selected.unit})` : 'Resource'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {resources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    <span className='size-2 shrink-0 rounded-full' style={{ backgroundColor: resource.color }} />
                    {resource.name} ({resource.unit})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            value={[view]}
            aria-label='Consumption values'
            onValueChange={(values) => {
              const selected = values[0];
              if (selected === 'meter' || selected === 'consumption') {
                onViewChange(selected);
              }
            }}
          >
            <ToggleGroupItem value='meter'>Meter reading</ToggleGroupItem>
            <ToggleGroupItem value='consumption'>Consumption (diff)</ToggleGroupItem>
          </ToggleGroup>
        </div>
      }
      pending={query.isPending}
      updating={query.isPlaceholderData}
      error={query.isError}
      retry={() => void query.refetch()}
    >
      {!selected ? (
        <p className='text-muted-foreground'>No consumption data for this year.</p>
      ) : (
        <div
          className='flex min-w-0 flex-col gap-3'
          role='group'
          aria-label={`Consumption history for ${selected.name}`}
        >
          <AnnualChart year={year} month={month} unit={selected.unit} series={series} />
          <div className='text-muted-foreground flex justify-center gap-1.5 text-xs'>
            <span className='mt-1 size-2 rounded-sm' style={{ backgroundColor: selected.color }} />
            <span>{selected.name}</span>
            <span>({selected.unit})</span>
          </div>
        </div>
      )}
    </Section>
  );
}
