import { createFileRoute } from '@tanstack/react-router';
import { Activity, CreditCard, DollarSign, Download, Users } from 'lucide-react';

import { DateRangePicker } from '@/app/home/date-range-picker';
import { Overview } from '@/app/home/overview';
import { RecentSales } from '@/app/home/recent-sales';
import { TeamSwitcher } from '@/app/home/team-switcher';
import { AppError } from '@/shared/components/errors/app-error';
import { Head } from '@/shared/components/head';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

export const Route = createFileRoute('/_protected/home')({
  component: HomeIndexPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
});

function HomeIndexPage() {
  return (
    <>
      <Head title='Home' />
      <div className='flex flex-col'>
        <div className='flex-1 space-y-4 pt-6'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-3xl font-bold tracking-tight'>Home</h2>
            <div className='flex items-center space-x-2'>
              <DateRangePicker />
              <Button size='sm'>
                <Download className='mr-2 h-4 w-4' />
                Download
              </Button>
            </div>
          </div>
          <Tabs className='space-y-4' defaultValue='overview'>
            <div className='flex justify-between'>
              <TabsList>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger disabled value='analytics'>
                  Analytics
                </TabsTrigger>
                <TabsTrigger disabled value='reports'>
                  Reports
                </TabsTrigger>
              </TabsList>
              <TeamSwitcher />
            </div>

            <TabsContent className='space-y-4' value='overview'>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>$45,231.89</div>
                    <p className='text-xs text-muted-foreground'>+20.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Subscriptions</CardTitle>
                    <Users className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+2350</div>
                    <p className='text-xs text-muted-foreground'>+180.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Sales</CardTitle>
                    <CreditCard className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+12,234</div>
                    <p className='text-xs text-muted-foreground'>+19% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Active Now</CardTitle>
                    <Activity className='h-4 w-4 text-muted-foreground' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>+573</div>
                    <p className='text-xs text-muted-foreground'>+201 since last hour</p>
                  </CardContent>
                </Card>
              </div>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
                <Card className='col-span-4'>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className='pl-2'>
                    <Overview />
                  </CardContent>
                </Card>
                <Card className='col-span-3'>
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>You made 265 sales this month.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
