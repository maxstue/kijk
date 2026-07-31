import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { EditIcon } from 'lucide-react';
import { Suspense, useState } from 'react';

import { ConsumptionUpdateForm } from '@/app/consumptions/update-form';
import type { Consumption } from '@/shared/types/domain';

interface Props {
  data: Consumption;
}

export function ConsumptionEditButton({ data }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  const handleClose = () => setShowDialog(false);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className='text-muted-foreground' size='icon' variant='outline'>
          <EditIcon className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Update Consumption</DialogTitle>
          <DialogDescription>Update this consumption.</DialogDescription>
        </DialogHeader>
        <Suspense>
          <ConsumptionUpdateForm initialData={data} onClose={handleClose} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
