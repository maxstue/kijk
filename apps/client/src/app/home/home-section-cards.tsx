import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function HomeSectionCards() {
  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>1,250 kWh</CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <TrendingUpIcon />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Trending up this month <TrendingUpIcon className='size-4' />
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Last Month</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>164 kWh</CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <TrendingDownIcon />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Down 20% this period <TrendingDownIcon className='size-4' />
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Active Month</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>150 kWh</CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <TrendingUpIcon />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Strong user retention <TrendingUpIcon className='size-4' />
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Average Usage</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>120 kWh</CardTitle>
          <CardAction>
            <Badge variant='outline'>
              <TrendingUpIcon />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Steady increase <TrendingUpIcon className='size-4' />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
