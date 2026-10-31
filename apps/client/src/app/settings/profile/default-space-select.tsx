import type { ReadyCurrentUser } from '@kijk/api/users/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useId } from 'react';

interface Props {
  spaces: NonNullable<ReadyCurrentUser['spaces']>;
  value: string | null;
  onChange: (spaceId: string | null) => void;
  disabled?: boolean;
}

/** Selects the account-wide default, independently of the space being viewed. */
export function DefaultSpaceSelect({ spaces, value, onChange, disabled }: Props) {
  const selectId = useId();
  return (
    <div className='space-y-2'>
      <label htmlFor={selectId} id={`${selectId}-label`} className='text-sm font-medium'>
        Default space
      </label>
      <Select
        items={Object.fromEntries([
          ['none', 'None — use the last visited space'],
          ...spaces.map((space) => [space.id, space.name]),
        ])}
        value={value ?? 'none'}
        disabled={disabled}
        onValueChange={(value) => {
          if (value === null) {
            return;
          }
          onChange(value === 'none' ? null : value);
        }}
      >
        <SelectTrigger id={selectId} aria-labelledby={`${selectId}-label`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='none'>None — use the last visited space</SelectItem>
          {spaces.map((space) => (
            <SelectItem key={space.id} value={space.id}>
              {space.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className='text-muted-foreground text-sm'>
        Without a default, Kijk opens the last visited space on this device, or your personal space.
      </p>
    </div>
  );
}
