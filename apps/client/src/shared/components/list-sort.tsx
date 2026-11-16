import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

import type { ListOption } from '@/shared/components/list-filter';

interface Props<TValue extends string> {
  value: TValue;
  options: ReadonlyArray<ListOption<TValue>>;
  onChange: (value: TValue) => void;
}

/** The sort order of a list without sortable column headers. */
export function ListSort<TValue extends string>({ value, options, onChange }: Props<TValue>) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        const option = options.find((item) => item.value === next);
        if (option) {
          onChange(option.value);
        }
      }}
    >
      <SelectTrigger aria-label='Sort order'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
