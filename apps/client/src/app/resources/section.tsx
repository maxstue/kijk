import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BarChart3, Hash, List } from 'lucide-react';
import { useState } from 'react';

import { getResourceTypeColumns, resourceDefaultSort } from '@/app/resources/columns';
import { ResourceTypeCreateForm } from '@/app/resources/create-form';
import { resourcesQueryOptions } from '@/shared/api/resources/options';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { DataTable } from '@/shared/components/data-table';
import { CreatorTypes } from '@/shared/types/domain';
import type { Resource } from '@/shared/types/domain';

export function ResourceTypesSection() {
  const [showDialog, setShowDialog] = useState(false);
  const { data } = useSuspenseQuery(resourcesQueryOptions());
  const { data: currentUser } = useSuspenseQuery(currentUserQueryOptions());
  const activeHousehold = currentUser.households?.find((household) => household.isActive);
  const canManage = activeHousehold?.role.name === 'Admin';
  const columns = getResourceTypeColumns(canManage);

  const handleClose = () => setShowDialog(false);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Resource types</h3>
        <p className='text-muted-foreground text-sm'>Manage your Resource types. Create, update or delete them.</p>
      </div>
      <Separator />
      <div className='grid gap-4 lg:grid-cols-2'>
        <ResourceTypeStatistics resources={data} />
      </div>
      <div className='w-full'>
        <div className='flex justify-end'>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!canManage}
                title={canManage ? undefined : 'Household admin role required'}
                variant='outline'
              >
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Create Resource</DialogTitle>
                <DialogDescription>Create a new resource type.</DialogDescription>
              </DialogHeader>
              <ResourceTypeCreateForm onClose={handleClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className='w-full'>
        <Card className='min-w-32'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Resource Types</CardTitle>
            <List className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='mt-2'>
              <DataTable columns={columns} data={data} defaultSort={resourceDefaultSort} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResourceTypeStatistics({ resources }: { resources: Resource[] }) {
  const dataCount = resources.length;
  const customCount = resources.filter((resource) => resource.creatorType === CreatorTypes.USER).length;

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Overall</CardTitle>
          <Hash className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{dataCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Custom</CardTitle>
          <BarChart3 className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{customCount}</div>
        </CardContent>
      </Card>
    </>
  );
}
