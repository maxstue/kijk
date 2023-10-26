import { Suspense, useState } from 'react';
import { BarChart3, Hash, List } from 'lucide-react';

import { categoryColumns, categoryDefaultSort } from '@/app/settings/categories/categories-columns';
import { CategoryCreateForm } from '@/app/settings/categories/categories-create-form';
import { DataTable } from '@/components/data-table';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CategotyType } from '@/types/app';

import { useGetCategories } from './use-get-categories';

export function CategoriesSection() {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Categories</h3>
        <p className='text-sm text-muted-foreground'>Manage your categories. Create, update or delete them.</p>
      </div>
      <Separator />
      <div className='grid gap-4 lg:grid-cols-2'>
        <CategoriesInfo />
      </div>
      <div className='w-full'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Overview</CardTitle>
            <List className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className='flex items-center justify-center'>
                  <Icons.spinner className='animate-spin' />
                </div>
              }
            >
              <Categories />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Categories() {
  const { data } = useGetCategories();
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = () => setShowSheet(false);

  return (
    <DataTable
      data={data?.data ?? []}
      columns={categoryColumns}
      defaultSort={categoryDefaultSort}
      actions={
        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetTrigger asChild>
            <Button variant='outline'>Create Category</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Category</SheetTitle>
              <SheetDescription>Create a new category.</SheetDescription>
            </SheetHeader>
            <CategoryCreateForm onClose={handleClose} />
          </SheetContent>
        </Sheet>
      }
    />
  );
}

function CategoriesInfo() {
  const { data } = useGetCategories();

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Count</CardTitle>
          <Hash className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{data.data?.length ?? 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Custom categories</CardTitle>
          <BarChart3 className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{data.data?.filter((c) => c.type === CategotyType.USER).length ?? 0}</div>
        </CardContent>
      </Card>
    </>
  );
}
