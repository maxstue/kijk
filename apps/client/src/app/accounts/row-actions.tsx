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
import { useState } from 'react';

import { AccountDeleteContent } from '@/app/accounts/delete-content';
import { AccountForm } from '@/app/accounts/form';
import type { AccountPermissions } from '@/app/accounts/types';
import type { Account } from '@/shared/api/accounts/types';
import type { DataTableFeatures } from '@/shared/lib/table-features';

interface Props {
  permissions: AccountPermissions;
  row: Row<DataTableFeatures, Account>;
}

/** Row menu of the account table: update and delete. Shared accounts need finances:configure. */
export function AccountRowActions({ permissions, row }: Props) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const account = row.original;
  const restriction = getManagementRestriction(account, permissions);
  const deleteRestriction =
    restriction ?? (account.kind === 'Cash' ? 'The cash account cannot be deleted.' : undefined);

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
          <AccountMenuItem
            label='Update'
            restriction={restriction}
            tooltip='Update account'
            onSelect={() => setShowUpdateDialog(true)}
          />
          <DropdownMenuSeparator />
          <AccountMenuItem
            label='Delete'
            restriction={deleteRestriction}
            tooltip='Delete account'
            variant='destructive'
            onSelect={() => setShowDeleteDialog(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Update {account.name}</DialogTitle>
              <DialogDescription>Kijk only stores the last four characters of an IBAN.</DialogDescription>
            </DialogHeader>
            <AccountForm
              canShare={permissions.canConfigure}
              initialData={account}
              showVisibility={!permissions.isPersonalSpace}
              onClose={() => setShowUpdateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AccountDeleteContent account={account} onClose={() => setShowDeleteDialog(false)} />
      </AlertDialog>
    </>
  );
}

function getManagementRestriction(account: Account, { canConfigure, canRecord }: AccountPermissions) {
  if (account.visibility === 'Private' ? !canRecord : !canConfigure) {
    return 'Your role in this space does not allow managing this account.';
  }
}

interface AccountMenuItemProps {
  label: string;
  onSelect: () => void;
  restriction: string | undefined;
  tooltip: string;
  variant?: 'default' | 'destructive';
}

function AccountMenuItem({ label, onSelect, restriction, tooltip, variant }: AccountMenuItemProps) {
  const disabled = restriction !== undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={disabled ? 'cursor-not-allowed' : undefined}>
          <DropdownMenuItem disabled={disabled} variant={variant} onSelect={onSelect}>
            {label}
          </DropdownMenuItem>
        </div>
      </TooltipTrigger>
      <TooltipContent>{restriction ?? tooltip}</TooltipContent>
    </Tooltip>
  );
}
