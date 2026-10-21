import * as unitsOptions from '@kijk/api/units/options';
import type { Unit } from '@kijk/api/units/types';
import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { UnitDeleteContent } from './delete-content';
import { UnitUpdateForm } from './update-form';

interface Props {
  spaceId?: string;
  /** Spaces in which the user's role allows sharing units. */
  shareableSpaces: Array<{ id: string; name: string }>;
  scope: 'space' | 'personal';
  unit: Unit;
}

/** Row menu of the unit table: edit, share, archive or restore, remove from space and delete. */
export function UnitRowActions({ spaceId, scope, shareableSpaces, unit }: Props) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const restoreMutation = useMutation(unitsOptions.restoreMutationOptions());
  const shareMutation = useMutation(unitsOptions.shareWithSpaceMutationOptions());
  const unshareMutation = useMutation(unitsOptions.removeFromSpaceMutationOptions());
  const canDelete = Number(unit.resourceCount) === 0 && unit.spaceIds.length === 0;
  const canUnshare = scope === 'space' && unit.isOwner && shareableSpaces.some((space) => space.id === spaceId);

  function restore() {
    restoreMutation.mutate(unit.id, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        toast.success('Unit restored');
      },
    });
  }

  function share(targetSpaceId: string) {
    shareMutation.mutate(
      { spaceId: targetSpaceId, id: unit.id },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          toast.success('Unit shared with space');
        },
      },
    );
  }

  function unshare() {
    if (!spaceId) {
      return;
    }
    unshareMutation.mutate(
      { spaceId, id: unit.id },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          toast.success('Unit removed from space');
        },
      },
    );
  }

  return (
    <>
      <div className='flex items-center gap-1'>
        {unit.conversionType === 'None' && unit.isOwner && (
          <Button size='sm' variant='outline' onClick={() => setShowUpdateDialog(true)}>
            Convert
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className='h-8 w-8 p-0' variant='ghost' />}>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  void navigator.clipboard.writeText(unit.name);
                  toast(`Successfully copied: ${unit.name}`);
                }}
              >
                Copy Name
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!unit.isOwner} onClick={() => setShowUpdateDialog(true)}>
                {unit.conversionType === 'None' ? 'Convert legacy unit' : 'Update'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <UnitSharingActions
                unit={unit}
                scope={scope}
                shareableSpaces={shareableSpaces}
                isPending={shareMutation.isPending}
                onShare={share}
              />
              {unit.isArchived && unit.isOwner && (
                <DropdownMenuItem disabled={restoreMutation.isPending} onClick={restore}>
                  Restore
                </DropdownMenuItem>
              )}
              {scope === 'space' && (
                <DropdownMenuItem disabled={!canUnshare || unshareMutation.isPending} onClick={unshare}>
                  Remove from space
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!unit.isOwner || !canDelete}
                variant='destructive'
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Unit</DialogTitle>
            <DialogDescription>Update the unit and its conversion definition.</DialogDescription>
          </DialogHeader>
          {showUpdateDialog && <UnitUpdateForm unit={unit} onClose={() => setShowUpdateDialog(false)} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <UnitDeleteContent unit={unit} onClose={() => setShowDeleteDialog(false)} />
      </AlertDialog>
    </>
  );
}

function UnitSharingActions({
  scope,
  shareableSpaces,
  unit,
  isPending,
  onShare,
}: Omit<Props, 'spaceId'> & { isPending: boolean; onShare: (spaceId: string) => void }) {
  if (scope !== 'personal' || !unit.isOwner || unit.isArchived) {
    return null;
  }
  const sharedSpaceIds = new Set(unit.spaceIds);
  return shareableSpaces
    .filter((space) => !sharedSpaceIds.has(space.id))
    .map((space) => (
      <DropdownMenuItem key={space.id} disabled={isPending} onClick={() => onShare(space.id)}>
        Share with {space.name}
      </DropdownMenuItem>
    ));
}
