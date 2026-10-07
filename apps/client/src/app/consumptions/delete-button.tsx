import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useDeleteConsumption } from '@/app/consumptions/use-delete-consumption';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { getMonthFromDate } from '@/shared/utils/months';

interface Props {
  date: string;
  id: string;
}

/** Deletes a consumption after confirmation. */
export function ConsumptionDeleteButton({ id, date }: Props) {
  const canRecord = useSpacePermission(SpacePermissions.consumptions.record);
  const [showModal, setShowModal] = useState(false);
  const { mutate } = useDeleteConsumption();

  const handleDelete = () => {
    if (!canRecord) {
      return;
    }
    const consumptionDate = new Date(date);
    const month = getMonthFromDate(consumptionDate);
    const year = consumptionDate.getFullYear();
    mutate(
      { id, month, year },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success('Successfully updated');
          setShowModal(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={!canRecord}
          title={canRecord ? undefined : 'Your role in this space does not allow deleting consumptions'}
          size='icon'
          variant='destructive'
        >
          <Trash2Icon className='size-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this consumption from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!canRecord} variant='destructive' onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
