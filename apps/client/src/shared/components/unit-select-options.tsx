import { SelectGroup, SelectItem, SelectLabel, SelectSeparator } from '@kijk/ui/components/select';
import { Fragment } from 'react';

import type { Unit } from '@/shared/api/units/types';

interface Props {
  units: Unit[];
}

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
