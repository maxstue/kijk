import { getRouteApi } from '@tanstack/react-router';
import { Droplet, Flame, Leaf, Sigma, TrendingUp, Zap } from 'lucide-react';

import { useGetEnergyStats } from '@/app/energy/use-get-energy-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

const Route = getRouteApi('/_protected/energy');

export default function EnergyStats() {
  const searchParameters = Route.useSearch();

  const selectedYear = searchParameters.year;
  const selectedMonth = searchParameters.month;

  const query = useGetEnergyStats(selectedYear, selectedMonth);

  console.log(query.data);
  const electricity = query.data?.electricity;
  const gas = query.data?.gas;
  const water = query.data?.water;

  return (
    <div className='grid gap-4 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Electricity</CardTitle>
          <Zap className='h-4 w-4 text-yellow-400' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {electricity.monthTotal} <span className='text-md font-normal text-muted-foreground'>kWh</span>
          </div>
          <p className='text-xs text-muted-foreground'>{electricity.comparisonMonthDiff} from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Water</CardTitle>
          <Droplet className='h-4 w-4 text-blue-400' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {water.monthTotal}{' '}
            <span className='text-md font-normal text-muted-foreground'>
              {' '}
              m<sup>3</sup>
            </span>
          </div>
          <p className='text-xs text-muted-foreground'>{water.comparisonMonthDiff} from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Gas</CardTitle>
          <Flame className='h-4 w-4 text-orange-400' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {gas.monthTotal}{' '}
            <span className='text-md font-normal text-muted-foreground'>
              {' '}
              m<sup>3</sup>
            </span>
          </div>
          <p className='text-xs text-muted-foreground'>{gas.comparisonMonthDiff} from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Year Overview</CardTitle>
          <Sigma className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          {/* Show all total year values */}
          <div className='flex flex-row items-center space-x-4'>
            <Zap className='h-4 w-4 text-yellow-400' />
            <div className='text-xl font-bold'>
              {electricity.yearTotal} <span className='text-md font-normal text-muted-foreground'>kWh</span>
            </div>
          </div>
          <div className='flex flex-row items-center space-x-4'>
            <Droplet className='h-4 w-4 text-blue-400' />
            <div className='text-xl font-bold'>
              {water.yearTotal}
              <span className='text-md font-normal text-muted-foreground'>
                {' '}
                m<sup>3</sup>
              </span>
            </div>
          </div>
          <div className='flex flex-row items-center space-x-4'>
            <Flame className='h-4 w-4 text-orange-400' />
            <div className='text-xl font-bold'>
              {gas.yearTotal}
              <span className='text-md font-normal text-muted-foreground'>
                {' '}
                m<sup>3</sup>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
