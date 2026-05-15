import { Button } from '@kijk/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kijk/ui/components/sheet';
import { EditIcon } from 'lucide-react';
import { Suspense, useState } from 'react';

import { ConsumptionUpdateForm } from '@/app/consumptions/update-form';
import type { Consumption } from '@/shared/types/domain';

interface Props {
  data: Consumption;
}

export function ConsumptionEditButton({ data }: Props) {
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = () => setShowSheet(false);

  return (
    <Sheet open={showSheet} onOpenChange={setShowSheet}>
      <SheetTrigger asChild>
        <Button className='text-muted-foreground' size='icon' variant='outline'>
          <EditIcon className='size-4' />
        </Button>
      </SheetTrigger>
      <SheetContent className='space-y-8'>
        <SheetHeader>
          <SheetTitle>Add Consumption</SheetTitle>
          <SheetDescription>Add a new consumption.</SheetDescription>
        </SheetHeader>
        <Suspense>
          <ConsumptionUpdateForm initialData={data} onClose={handleClose} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}
