import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

import type { ColumnRole } from '@/app/imports/constants';
import { columnRoles, ignoredColumn } from '@/app/imports/constants';

interface ColumnRoleSelectProps {
  role: ColumnRole | undefined;
  onChange: (role: ColumnRole | undefined) => void;
}

export function ColumnRoleSelect({ onChange, role }: ColumnRoleSelectProps) {
  return (
    <Select
      items={[
        { label: 'Not imported', value: ignoredColumn },
        ...columnRoles.map((option) => ({ label: option.label, value: option.key })),
      ]}
      value={role ?? ignoredColumn}
      onValueChange={(value) => onChange(value === ignoredColumn ? undefined : (value as ColumnRole))}
    >
      <SelectTrigger aria-label='Column content' className='w-full' size='sm'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ignoredColumn}>Not imported</SelectItem>
        {columnRoles.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
