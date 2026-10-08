import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Tags } from 'lucide-react';

import { categoryDefaultSort, getCategoryColumns } from '@/app/categories/columns';
import { categoriesQueryOptions } from '@/shared/api/categories/options';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { DataTable } from '@/shared/components/data-table';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Categories page: default and custom categories, with create, update and delete for the custom ones. */
export function CategoriesSection() {
  const canConfigure = useSpacePermission(SpacePermissions.finances.configure);
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const columns = getCategoryColumns(canConfigure);

  return (
    <div className='space-y-6'>
      <p className='text-muted-foreground text-sm'>
        Default categories are available to every space; add your own on top.
      </p>
      <Card className='min-w-32'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Categories</CardTitle>
          <Tags className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='mt-2'>
            <DataTable columns={columns} data={categories} defaultSort={categoryDefaultSort} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
