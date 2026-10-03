import { Button } from '@kijk/ui/components/button';
import { Link } from '@tanstack/react-router';
import { EditIcon } from 'lucide-react';

import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

interface Props {
  id: string;
}

/** Opens the edit page of a consumption, keeping the current search params. */
export function ConsumptionEditButton({ id }: Props) {
  const canRecord = useHouseholdPermission(HouseholdPermissions.consumptions.record);
  if (!canRecord) return null;

  return (
    <Button asChild className='text-muted-foreground' size='icon' variant='outline'>
      <Link to='/consumptions/$consumptionId' params={{ consumptionId: id }} search={(previous) => previous}>
        <EditIcon className='size-4' />
        <span className='sr-only'>Edit consumption</span>
      </Link>
    </Button>
  );
}
