import { getRouteApi } from '@tanstack/react-router';
import { Droplet, Flame, Sigma, Zap } from 'lucide-react';

import EnergyUnit from '@/app/energy/energy-unit';
import { useGetEnergyStats } from '@/app/energy/use-get-energy-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { EnergyTypes } from '@/shared/types/app';

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
            {electricity.monthTotal} <EnergyUnit type={EnergyTypes.ELECTRICITY} />
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
            {water.monthTotal} <EnergyUnit type={EnergyTypes.WATER} />
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
            {gas.monthTotal} <EnergyUnit type={EnergyTypes.GAS} />
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
              {electricity.yearTotal}
              <EnergyUnit type={EnergyTypes.ELECTRICITY} />
            </div>
          </div>
          <div className='flex flex-row items-center space-x-4'>
            <Droplet className='h-4 w-4 text-blue-400' />
            <div className='text-xl font-bold'>
              {water.yearTotal}
              <EnergyUnit type={EnergyTypes.WATER} />
            </div>
          </div>
          <div className='flex flex-row items-center space-x-4'>
            <Flame className='h-4 w-4 text-orange-400' />
            <div className='text-xl font-bold'>
              {gas.yearTotal}
              <EnergyUnit type={EnergyTypes.GAS} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
