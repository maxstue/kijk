import { useCallback, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import type { Row } from '@tanstack/react-table';

import type { ResourceFormValues } from '@/app/resources/schemas';
import type { Resource } from '@/shared/types/app';
import { resourceSchema } from '@/app/resources/schemas';
import { useDeleteResource } from '@/app/resources/use-delete-resource';
import { useUpdateResource } from '@/app/resources/use-update-resource-type';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { cn } from '@/shared/lib/helpers';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function ResourceTypeListRowActions<TData extends Resource>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'edit' | 'delete'>();
  const resourceType = row.original;

  const handleCopyName = useCallback(async () => {
    await navigator.clipboard.writeText(resourceType.name);
    toast(`Successfully copied: ${resourceType.name}`);
  }, [resourceType.name]);

  const handleClose = useCallback(() => {
    setShowSheet(false);
    setSheetType(undefined);
  }, []);

  return (
    <Dialog open={showEdit} onOpenChange={setShowEdit}>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className='h-8 w-8 p-0' variant='ghost'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyName}>Copy Name</DropdownMenuItem>
            {resourceType.creator !== 'Default' && (
              <>
                <SheetTrigger
                  asChild
                  onClick={() => {
                    setSheetType('edit');
                  }}
                >
                  <DropdownMenuItem>Update</DropdownMenuItem>
                </SheetTrigger>
                <DropdownMenuSeparator />
                <SheetTrigger
                  asChild
                  onClick={() => {
                    setSheetType('delete');
                  }}
                >
                  <DropdownMenuItem className={cn('focus:bg-red-500 focus:text-white')}>Delete</DropdownMenuItem>
                </SheetTrigger>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent>
          {sheetType === 'delete' && <Delete resourceType={resourceType} onClose={handleClose} />}
          {sheetType === 'edit' && <Update resourceType={resourceType} onClose={handleClose} />}
        </SheetContent>
      </Sheet>
    </Dialog>
  );
}

interface EdProps {
  resourceType: Resource;
  onClose: () => void;
}

function Delete({ resourceType, onClose }: EdProps) {
  const deleteMutation = useDeleteResource();

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: resourceType.id },
      {
        onSuccess() {
          toast(`Successfully deleted: ${resourceType.name} `);
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
            <span className='blend-' style={{ color: resourceType.color }}>
              {resourceType.color}
            </span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <div className='flex w-full items-center justify-between gap-2'>
          <SheetClose asChild>
            <Button disabled={deleteMutation.isPending} type='button' variant='outline'>
              Cancel
            </Button>
          </SheetClose>
          <Button className='bg-red-500' disabled={deleteMutation.isPending} type='button' onClick={handleDelete}>
            Delete
          </Button>
          {deleteMutation.isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
        </div>
      </SheetFooter>
    </div>
  );
}

const handleError = () => {
  toast.error('Error updating', {
    description: 'Error updating',
  });
};

function Update({ resourceType, onClose }: EdProps) {
  const form = useZodForm({
    schema: resourceSchema,
    values: resourceType,
  });
  const updateMutation = useUpdateResource();

  function onSubmit(data: ResourceFormValues) {
    updateMutation.mutate(
      { resourceType: data, id: resourceType.id },
      {
        onSuccess() {
          toast(`Successfully updated: ${data.name} `);
          onClose();
        },
      },
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Update {resourceType.name}</SheetTitle>
        <SheetDescription>Change the values.</SheetDescription>
      </SheetHeader>
      <div className='p-4'>
        <Form className='space-y-8' form={form} onInvalid={handleError} onSubmit={onSubmit}>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='unit'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder='Unit' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='color'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder='Color, e.g. `#123456`' type='color' {...field} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SheetFooter>
            <div className='flex w-full items-center justify-between gap-2'>
              <SheetClose asChild>
                <Button disabled={updateMutation.isPending} type='button' variant='outline'>
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={updateMutation.isPending} type='submit'>
                Update
              </Button>
              {updateMutation.isPending && <Icons.spinner className='animate-spin' />}
            </div>
          </SheetFooter>
        </Form>
      </div>
    </>
  );
}
