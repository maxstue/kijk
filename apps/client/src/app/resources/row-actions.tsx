import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ResourceTypeDeleteContent } from '@/app/resources/delete-content';
import { ResourceTypeUpdateForm } from '@/app/resources/update-form';
import { CreatorTypes } from '@/shared/types/domain';
import type { Resource } from '@/shared/types/domain';

interface DataTableRowActionsProps<TData> {
  canManage: boolean;
  row: Row<TData>;
}

export function ResourceTypeRowActions<TData extends Resource>({ canManage, row }: DataTableRowActionsProps<TData>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const resourceType = row.original;

  const handleCopyName = useCallback(async () => {
    await navigator.clipboard.writeText(resourceType.name);
    toast(`Successfully copied: ${resourceType.name}`);
  }, [resourceType.name]);

  const handleCloseDeleteDialog = useCallback(() => setShowDeleteDialog(false), []);
  const handleCloseUpdateDialog = useCallback(() => setShowUpdateDialog(false), []);

  return (
    <>
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
          {resourceType.creatorType === CreatorTypes.SYSTEM ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='cursor-not-allowed'>
                    <DropdownMenuItem disabled>Update</DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent>System resources are read-only.</TooltipContent>
              </Tooltip>
              <DropdownMenuSeparator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='cursor-not-allowed'>
                    <DropdownMenuItem disabled variant='destructive'>
                      Delete
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent>System resources are read-only.</TooltipContent>
              </Tooltip>
            </>
          ) : canManage ? (
            <>
              <DropdownMenuItem onSelect={() => setShowUpdateDialog(true)}>Update</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onSelect={() => setShowDeleteDialog(true)}>
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem disabled>Household admin role required</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Update {resourceType.name}</DialogTitle>
            <DialogDescription>Change the values.</DialogDescription>
          </DialogHeader>
          <ResourceTypeUpdateForm initialData={resourceType} onClose={handleCloseUpdateDialog} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <ResourceTypeDeleteContent resourceType={resourceType} onClose={handleCloseDeleteDialog} />
      </AlertDialog>
    </>
  );
}
