import { Suspense, useState } from 'react';
import { BarChart3, Hash, List } from 'lucide-react';

import { useGetResources } from './use-get-resources';
import { ResourceTypeCreateForm } from '@/app/resources/resource-create-form';
import { resourceDefaultSort, resourcesColumns } from '@/app/resources/resources-columns';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Separator } from '@/shared/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { CreatorTypes } from '@/shared/types/app';

export function ResourceTypesSection() {
  const [showSheet, setShowSheet] = useState(false);
  const { data } = useGetResources();

  const handleClose = () => setShowSheet(false);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Resource types</h3>
        <p className='text-muted-foreground text-sm'>Manage your Resource types. Create, update or delete them.</p>
      </div>
      <Separator />
      <div className='grid gap-4 lg:grid-cols-2'>
        <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
          <ResourceTypeStatistics />
        </Suspense>
      </div>
      <div className='w-full'>
        <div className='flex justify-end'>
          <Sheet open={showSheet} onOpenChange={setShowSheet}>
            <SheetTrigger asChild>
              <Button variant='outline'>Create</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create</SheetTitle>
                <SheetDescription>Create a new resource type.</SheetDescription>
              </SheetHeader>
              <div className='p-4'>
                <ResourceTypeCreateForm onClose={handleClose} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className='w-full'>
        <Card className='min-w-32'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Resource Types</CardTitle>
            <List className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
              <div className='mt-2'>
                <DataTable columns={resourcesColumns} data={data} defaultSort={resourceDefaultSort} />
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResourceTypeStatistics() {
  const { data } = useGetResources();

  const dataCount = data.length;
  const customCount = data.filter((x) => x.creator === CreatorTypes.USER).length;

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
