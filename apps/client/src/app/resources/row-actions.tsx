import { cn } from '@kijk/core/utils/style';
import { Button } from '@kijk/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kijk/ui/components/sheet';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ResourceTypeDeleteContent } from '@/app/resources/delete-content';
import { ResourceTypeUpdateForm } from '@/app/resources/update-form';
import { CreatorTypes } from '@/shared/types/domain';
import type { Resource } from '@/shared/types/domain';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function ResourceTypeRowActions<TData extends Resource>({ row }: DataTableRowActionsProps<TData>) {
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
          {resourceType.creatorType !== CreatorTypes.SYSTEM && (
            <>
              <SheetTrigger
                onClick={() => {
                  setSheetType('edit');
                }}
              >
                <DropdownMenuItem>Update</DropdownMenuItem>
              </SheetTrigger>
              <DropdownMenuSeparator />
              <SheetTrigger
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
      <SheetContent className='space-y-8'>
        {sheetType === 'delete' && <ResourceTypeDeleteContent resourceType={resourceType} onClose={handleClose} />}
        {sheetType === 'edit' && (
          <>
            <SheetHeader>
              <SheetTitle>Update {resourceType.name}</SheetTitle>
              <SheetDescription>Change the values.</SheetDescription>
            </SheetHeader>
            <ResourceTypeUpdateForm initialData={resourceType} onClose={handleClose} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
