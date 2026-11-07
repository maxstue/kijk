import type { Limit } from '@kijk/api/limits/types';
import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { EditIcon, History, Trash2 } from 'lucide-react';

import { LimitDeleteContent } from './delete-content';
import { LimitForm } from './form';
import { LimitHistoryContent } from './history';
import type { LimitActionsProps, LimitSelection } from './types';

/** Shared actions for both list rows and cards. Dialog state belongs to the section. */
export function LimitActions({ limit, canPlan, onAction }: LimitActionsProps) {
  const permissionHint = canPlan ? undefined : 'Your role in this space does not allow planning limits';

  return (
    <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap'>
      <Button
        variant='outline'
        size='sm'
        aria-haspopup='dialog'
        onClick={() => onAction({ id: limit.id, action: 'history' })}
      >
        <History data-icon='inline-start' /> History
      </Button>
      <Button
        disabled={!canPlan}
        title={permissionHint}
        aria-label='Edit limit'
        aria-haspopup='dialog'
        size='icon-sm'
        variant='outline'
        onClick={() => onAction({ id: limit.id, action: 'edit' })}
      >
        <EditIcon />
      </Button>
      <Button
        disabled={!canPlan}
        title={permissionHint}
        aria-label='Delete limit'
        aria-haspopup='dialog'
        size='icon-sm'
        variant='destructive'
        onClick={() => onAction({ id: limit.id, action: 'delete' })}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

interface LimitDialogsProps {
  limit?: Limit;
  selection: LimitSelection | null;
  onClose: () => void;
}

/** Stays mounted outside the view switch so open forms keep their state. */
export function LimitDialogs({ limit, selection, onClose }: LimitDialogsProps) {
  if (!limit || !selection) {
    return null;
  }

  return (
    <>
      <AlertDialog
        open={selection.action === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <LimitDeleteContent limit={limit} onClose={onClose} />
      </AlertDialog>
      <Dialog
        open={selection.action !== 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        {selection.action === 'history' ? (
          <LimitHistoryContent limit={limit} />
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit consumption limit</DialogTitle>
              <DialogDescription>Update the target, period or warning status.</DialogDescription>
            </DialogHeader>
            <LimitForm initialData={limit} onClose={onClose} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
