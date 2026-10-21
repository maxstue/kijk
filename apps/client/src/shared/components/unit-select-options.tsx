import type { Unit } from '@kijk/api/units/types';
import { SelectGroup, SelectItem, SelectLabel, SelectSeparator } from '@kijk/ui/components/select';
import { Fragment } from 'react';

interface Props {
  units: Unit[];
}

/** Labels of the units for the `items` of a select, so the selected unit shows its name instead of its id. */
export const unitSelectItems = (units: Unit[]) =>
  units.map((unit) => ({ label: `${unit.name} (${unit.symbol})`, value: unit.id }));

/** Select options for convertible, non-archived units, grouped by quantity. */
export function UnitSelectOptions({ units }: Props) {
  const groups = Map.groupBy(
    units.filter((unit) => unit.conversionType !== 'None' && !unit.isArchived),
    (unit) => unit.quantityKey,
  );
  const quantityKeys = [...groups.keys()].sort((left, right) => left.localeCompare(right));

  return quantityKeys.map((quantityKey, index) => (
    <Fragment key={quantityKey}>
      {index > 0 && <SelectSeparator />}
      <SelectGroup>
        <SelectLabel>{quantityKey}</SelectLabel>
        {groups
          .get(quantityKey)
          ?.toSorted((left, right) => left.name.localeCompare(right.name))
          .map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name} ({unit.symbol})
            </SelectItem>
          ))}
      </SelectGroup>
    </Fragment>
  ));
}
