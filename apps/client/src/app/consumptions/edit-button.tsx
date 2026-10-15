import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Button } from '@kijk/ui/components/button';
import { Link } from '@tanstack/react-router';
import { EditIcon } from 'lucide-react';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

interface Props {
  id: string;
}

/** Opens the edit page of a consumption, keeping the current search params. */
export function ConsumptionEditButton({ id }: Props) {
  const canRecord = useSpacePermission(SpacePermissions.consumptions.record);
  if (!canRecord) {
    return null;
  }

  return (
    <Button
      render={
        <Link
          from='/consumptions'
          to='/consumptions/$consumptionId'
          params={{ consumptionId: id }}
          search={(previous) => previous}
        />
      }
      className='text-muted-foreground'
      size='icon'
      variant='outline'
      nativeButton={false}
    >
      <EditIcon className='size-4' />
      <span className='sr-only'>Edit consumption</span>
    </Button>
  );
}
