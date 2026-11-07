import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';

import type { ConsumptionView } from './types';

interface ResourceOption {
  id: string;
  name: string;
  unit: string;
  color: string;
}
interface ConsumptionControlsProps {
  resources: ResourceOption[];
  selected?: ResourceOption;
  view: ConsumptionView;
  onResourceChange: (resourceId: string) => void;
  onViewChange: (view: ConsumptionView) => void;
}
export function ConsumptionControls({
  resources,
  selected,
  view,
  onResourceChange,
  onViewChange,
}: ConsumptionControlsProps) {
  return (
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
  );
}
