import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import { useState } from 'react';

import { accountDefaultSort, getAccountColumns } from '@/app/accounts/columns';
import { AccountForm } from '@/app/accounts/form';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { DataTable } from '@/shared/components/data-table';
import { PageAddButton, PageToolbar } from '@/shared/components/page-header';
import { useActiveSpace } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/**
 * Accounts page: the space's bank accounts with create, update and delete. Members may keep private accounts; shared
 * accounts need finances:configure.
 */
export function AccountsSection() {
  const canConfigure = useSpacePermission(SpacePermissions.finances.configure);
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const isPersonalSpace = useActiveSpace()?.isPersonal ?? false;
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const canCreate = canConfigure || canRecord;
  const columns = getAccountColumns({ canConfigure, canRecord, isPersonalSpace });

  return (
    <div className='space-y-6'>
      <PageToolbar
        actions={
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <PageAddButton
                disabled={!canCreate}
                title={canCreate ? undefined : 'Your role in this space does not allow adding accounts'}
              >
                Add account
              </PageAddButton>
            </DialogTrigger>
            <DialogContent>
              <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>Add account</DialogTitle>
                  <DialogDescription>Kijk only stores the last four characters of an IBAN.</DialogDescription>
                </DialogHeader>
                <AccountForm
                  canShare={canConfigure}
                  showVisibility={!isPersonalSpace}
                  onClose={() => setShowCreateDialog(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className='min-w-32'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Accounts</CardTitle>
          <Landmark className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='mt-2'>
            <DataTable columns={columns} data={accounts} defaultSort={accountDefaultSort} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
