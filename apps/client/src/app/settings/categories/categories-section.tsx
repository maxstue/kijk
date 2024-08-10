import { Suspense, useCallback, useMemo, useState } from 'react';
import { BarChart3, Hash, List } from 'lucide-react';

import { categoryColumns, categoryDefaultSort } from '@/app/settings/categories/categories-columns';
import { CategoryCreateForm } from '@/app/settings/categories/categories-create-form';
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
import { CategoryCreatorTypes, CategoryType, CategoryTypes } from '@/shared/types/app';

import { useGetCategories } from './use-get-categories';

export function CategoriesSection() {
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = useCallback(() => {
    setShowSheet(false);
  }, []);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Categories</h3>
        <p className='text-sm text-muted-foreground'>Manage your categories. Create, update or delete them.</p>
      </div>
      <Separator />
      <div className='grid gap-4 lg:grid-cols-2'>
        <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
          <CategoriesInfo />
        </Suspense>
      </div>
      <div className='w-full'>
        <div className='flex justify-end'>
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
        </div>
      </div>
      <div className='grid w-full grid-cols-1 gap-4 xl:grid-cols-2'>
        {Object.entries(CategoryTypes).map(([key, value]) => (
          <Card key={key} className='min-w-32'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{value}</CardTitle>
              <List className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
                <div className='mt-2'>
                  <Categories type={value} />
                </div>
              </Suspense>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Categories({ type }: { type: CategoryType }) {
  const { data } = useGetCategories();

  const filteredData = data.data?.[type] ?? [];

  return <DataTable columns={categoryColumns} data={filteredData} defaultSort={categoryDefaultSort} />;
}

function CategoriesInfo() {
  const { data } = useGetCategories();

  const dataCount = useMemo(() => {
    if (data.data === undefined) {
      return 0;
    }

    return Object.entries(data.data).flatMap((x) => x[1]).length;
  }, [data.data]);

  const customCount = useMemo(() => {
    if (data.data === undefined) {
      return 0;
    }

    return Object.entries(data.data)
      .flatMap((x) => x[1])
      .filter((x) => x.creatorType === CategoryCreatorTypes.USER).length;
  }, [data.data]);

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Count</CardTitle>
          <Hash className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{dataCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Custom categories</CardTitle>
          <BarChart3 className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{customCount}</div>
        </CardContent>
      </Card>
    </>
  );
}
