import { BarChart3, FormInput, Hash, List } from 'lucide-react';

import CategoryCreateForm from '@/app/settings/categories/category-create-form';
import { columns } from '@/app/settings/categories/data-list-columns';
import { DataTable } from '@/components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function CategoriesPage() {
  // const user = await getCurrentUser();
  // if (!user) {
  //   redirect('/login');
  // }
  // const { categories } = await getCategories({ userId: user.id });

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Categories</h3>
        <p className='text-sm text-muted-foreground'>Here you can manage you categories.</p>
      </div>
      <Separator />
      <CategoryCreateForm />
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Count</CardTitle>
            <Hash className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Transaction/Category count</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>{/*TODO <div className='text-2xl font-bold'>&quot;Hier dann Chart&quot;</div> */}</CardContent>
        </Card>
      </div>
      <div className='w-full'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>New Expense/Income</CardTitle>
            <FormInput className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <CategoryCreateForm />
          </CardContent>
        </Card>
      </div>
      <div className='w-full'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Month Overview</CardTitle>
            <List className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {/* TODO load data */}
            <DataTable data={[]} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
