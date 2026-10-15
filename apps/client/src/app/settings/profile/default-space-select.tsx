import { setDefaultSpaceMutationOptions } from '@kijk/api/users/options';
import type { ReadyCurrentUser } from '@kijk/api/users/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

/** Selects the account-wide default, independently of the space being viewed. */
export function DefaultSpaceSelect({ spaces }: { spaces: NonNullable<ReadyCurrentUser['spaces']> }) {
  const defaultMutation = useMutation(setDefaultSpaceMutationOptions());
  return (
    <div className='space-y-2'>
      <label id='default-space-label' className='text-sm font-medium'>
        Default space
      </label>
      <Select
        items={Object.fromEntries([
          ['none', 'None — use the last visited space'],
          ...spaces.map((space) => [space.id, space.name]),
        ])}
        value={spaces.find((space) => space.isDefault)?.id ?? 'none'}
        disabled={defaultMutation.isPending}
        onValueChange={(value) => {
          if (value === null) {
            return;
          }
          defaultMutation.mutate(value === 'none' ? null : value, {
            onError: (error) => toast.error(error.message),
            onSuccess: () => toast.success('Default space updated'),
          });
        }}
      >
        <SelectTrigger aria-labelledby='default-space-label'>
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
