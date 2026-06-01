import { Button } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@kijk/ui/components/sheet';
import { toast } from 'sonner';

import { useDeleteResource } from '@/app/resources/use-delete-resource';
import type { Resource } from '@/shared/types/domain';

interface Props {
  onClose: () => void;
  resourceType: Resource;
}

export function ResourceTypeDeleteContent({ onClose, resourceType }: Props) {
  const { isPending, mutate } = useDeleteResource();

  const handleDelete = () => {
    mutate(
      { id: resourceType.id },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success(`Successfully deleted: ${resourceType.name}`);
          onClose();
        },
      },
    );
  };

  return (
    <div className='space-y-8'>
      <SheetHeader>
        <SheetTitle>Delete</SheetTitle>
        <SheetDescription>This will irrevocably delete this resource type.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-3 p-4'>
        <div className='flex w-1/2 flex-col'>
          <div className='flex justify-between'>
            <span className='font-bold'>Name:</span>
            <span>{resourceType.name}</span>
          </div>
          <div className='flex justify-between'>
            <span className='font-bold'>Unit:</span>
            <span>{resourceType.unit}</span>
          </div>
          <div className='flex justify-between'>
            <span className='font-bold'>Color:</span>
            <span style={{ color: resourceType.color }}>{resourceType.color}</span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <div className='flex w-full items-center justify-between gap-2'>
          <SheetClose>
            <Button disabled={isPending} type='button' variant='outline'>
              Cancel
            </Button>
          </SheetClose>
          <Button className='bg-red-500' disabled={isPending} type='button' onClick={handleDelete}>
            Delete
          </Button>
          {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
        </div>
      </SheetFooter>
    </div>
  );
}
