import * as categoriesOptions from '@kijk/api/categories/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Tags } from 'lucide-react';

import { categorySort, getCategoryColumns } from '@/app/categories/columns';
import { DataTable } from '@/shared/components/data-table';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import type { TableControlProps } from '@/shared/lib/table-query';

/** Categories page: default and custom categories, with create, update and delete for the custom ones. */
interface Props extends TableControlProps {}

export function CategoriesSection({ state, onStateChange }: Props) {
  const spaceId = useSpaceId();
  const canConfigure = useSpacePermission(SpacePermissions.finances.configure);
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
            <DataTable
              state={state}
              onStateChange={onStateChange}
              columns={columns}
              queryOptions={(query) => categoriesOptions.listQueryOptions(spaceId, query)}
              searchPlaceholder='Search name...'
              sort={categorySort}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
