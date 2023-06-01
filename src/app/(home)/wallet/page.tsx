import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DollarSign, Download, FormInput, List, Users } from 'lucide-react';

import { DataList } from '@/app/(home)/wallet/_components/data-list';
import { TransactionForm } from '@/app/(home)/wallet/_components/transaction-form';
import { getCurrentUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'kijk wallet',
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex justify-end'>
        <Button size='sm' disabled>
          <Download className='h-4 w-4' />
        </Button>
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Balance</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>$4,231.89</div>
            <p className='text-xs text-muted-foreground'>+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Year Overview</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
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
            <Suspense fallback={<div>Loading ...</div>}>
              <TransactionForm />
            </Suspense>
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
            {/* TODO TS 5.1 */}
            {/* @ts-expect-error Server Component*/}
            <DataList searchParams={searchParams} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
