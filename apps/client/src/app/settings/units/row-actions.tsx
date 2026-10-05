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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/api/query-keys';
import {
  archiveUnitMutationOptions,
  shareUnitMutationOptions,
  unshareUnitMutationOptions,
} from '@/shared/api/units/options';
import type { Unit } from '@/shared/api/units/types';

import { UnitDeleteContent } from './delete-content';
import { UnitUpdateForm } from './update-form';

interface Props {
  spaceId?: string;
  /** Spaces in which the user's role allows sharing units. */
  shareableSpaces: Array<{ id: string; name: string }>;
  scope: 'space' | 'personal';
  systemUnits: Unit[];
  unit: Unit;
}

/** Row menu of the unit table: edit, share, archive or restore, remove from space and delete. */
export function UnitRowActions({ spaceId, scope, shareableSpaces, systemUnits, unit }: Props) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const archiveMutation = useMutation(archiveUnitMutationOptions());
  const shareMutation = useMutation(shareUnitMutationOptions());
  const unshareMutation = useMutation(unshareUnitMutationOptions());
  const canDelete = Number(unit.resourceCount) === 0 && unit.spaceIds.length === 0;
  const canUnshare = scope === 'space' && unit.isOwner && shareableSpaces.some((space) => space.id === spaceId);

  function restore() {
    archiveMutation.mutate(
      { id: unit.id, restore: true },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
          toast.success('Unit restored');
        },
      },
    );
  }

  function share(targetSpaceId: string) {
    shareMutation.mutate(
      { spaceId: targetSpaceId, id: unit.id },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
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
          void queryClient.invalidateQueries({ queryKey: queryKeys.units.all });
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
          <DropdownMenuTrigger asChild>
            <Button className='h-8 w-8 p-0' variant='ghost'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(unit.name);
                toast(`Successfully copied: ${unit.name}`);
              }}
            >
              Copy Name
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!unit.isOwner} onSelect={() => setShowUpdateDialog(true)}>
              {unit.conversionType === 'None' ? 'Convert legacy unit' : 'Update'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {scope === 'personal' &&
              unit.isOwner &&
              !unit.isArchived &&
              shareableSpaces
                .filter((space) => !unit.spaceIds.includes(space.id))
                .map((space) => (
                  <DropdownMenuItem key={space.id} disabled={shareMutation.isPending} onSelect={() => share(space.id)}>
                    Share with {space.name}
                  </DropdownMenuItem>
                ))}
            {unit.isArchived && unit.isOwner && (
              <DropdownMenuItem disabled={archiveMutation.isPending} onSelect={restore}>
                Restore
              </DropdownMenuItem>
            )}
            {scope === 'space' && (
              <DropdownMenuItem disabled={!canUnshare || unshareMutation.isPending} onSelect={unshare}>
                Remove from space
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={!unit.isOwner || !canDelete}
              variant='destructive'
              onSelect={() => setShowDeleteDialog(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Unit</DialogTitle>
            <DialogDescription>Update the unit and its conversion definition.</DialogDescription>
          </DialogHeader>
          {showUpdateDialog && (
            <UnitUpdateForm systemUnits={systemUnits} unit={unit} onClose={() => setShowUpdateDialog(false)} />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <UnitDeleteContent unit={unit} onClose={() => setShowDeleteDialog(false)} />
      </AlertDialog>
    </>
  );
}
