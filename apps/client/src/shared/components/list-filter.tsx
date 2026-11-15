import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

interface Props {
  label: string;
  allowAll?: boolean;
  value?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}

/** An optional list filter with an explicit all-items choice. */
export function ListFilter({ label, value, options, onChange, allowAll = true }: Props) {
  const items = allowAll ? [{ value: 'all', label: `All ${label.toLowerCase()}` }, ...options] : [...options];
  return (
    <Select
      items={items}
      value={value ?? 'all'}
      onValueChange={(next) => onChange(next === 'all' || next === null ? undefined : next)}
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
