import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

/** A choice of a list filter or sort order. */
export interface ListOption<TValue extends string> {
  value: TValue;
  label: string;
}

/** Select value of the all-items choice; never a filter value. */
const allValue = '__all__';

interface Props<TValue extends string> {
  label: string;
  value?: TValue;
  options: ReadonlyArray<ListOption<TValue>>;
  onChange: (value: TValue | undefined) => void;
}

/** An optional list filter with an explicit all-items choice. */
export function ListFilter<TValue extends string>({ label, value, options, onChange }: Props<TValue>) {
  const items = [{ value: allValue, label: `All ${label.toLowerCase()}` }, ...options];
  return (
    <Select
      items={items}
      value={value ?? allValue}
      onValueChange={(next) => onChange(options.find((option) => option.value === next)?.value)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
