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
import { months } from '@/shared/utils/months';

interface Props {
  date: string;
  id: string;
}

export function ConsumptionDeleteButton({ id, date }: Props) {
  const [showModal, setShowModal] = useState(false);
  const { mutate } = useDeleteConsumption();

  const handleDelete = () => {
    const month = new Date(date).getMonth();
    const year = new Date(date).getFullYear();
    mutate(
      { id, month: months[month], year },
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
        <Button size='icon' variant='destructive'>
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
          <AlertDialogAction variant='destructive' onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
