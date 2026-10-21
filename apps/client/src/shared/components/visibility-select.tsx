import type { components } from '@kijk/api/generated/kijk';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { LockIcon, UsersIcon } from 'lucide-react';

/** Who can see an account or a budget within a shared space. */
export type Visibility = components['schemas']['Visibility'];

interface Props {
  /** Whether the user may create shared items; otherwise only private ones are offered. */
  canShare: boolean;
  disabled?: boolean;
  id?: string;
  value: Visibility;
  onChange: (value: Visibility) => void;
}

const visibilityItems: Array<{ label: string; value: Visibility }> = [
  { label: 'Shared with the space', value: 'Shared' },
  { label: 'Private, only for me', value: 'Private' },
];

/** Chooses between shared (every member) and private (only me). */
export function VisibilitySelect({ canShare, disabled, id, onChange, value }: Props) {
  return (
    <Select
      disabled={disabled}
      items={visibilityItems}
      value={value}
      onValueChange={(next) => onChange(next as Visibility)}
    >
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem disabled={!canShare} value='Shared'>
          <UsersIcon /> Shared with the space
        </SelectItem>
        <SelectItem value='Private'>
          <LockIcon /> Private, only for me
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/** Small marker for private items in shared spaces. */
export function PrivateBadge() {
  return (
    <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
      <LockIcon aria-hidden='true' className='size-3' /> Private
    </span>
  );
}
