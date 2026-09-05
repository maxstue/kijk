import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Suspense } from 'react';

import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionLimitWarning } from '@/app/consumptions/limit-warning';
import ConsumptionStats from '@/app/consumptions/stats';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { Loader } from '@/shared/components/ui/loaders/loader';
import type { Consumption } from '@/shared/types/domain';

export function ConsumptionMonthView({ consumptions }: { consumptions: Consumption[] }) {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <ConsumptionStats />
      </Suspense>
      <section aria-labelledby='consumption-entries-heading' className='space-y-4'>
        <div className='space-y-1'>
          <h3 id='consumption-entries-heading' className='text-lg font-semibold tracking-tight'>
            Consumption entries
          </h3>
          <p className='text-muted-foreground text-sm'>Individual records for this month.</p>
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {consumptions.map((item) => (
            <Card key={item.id} className='transition-shadow hover:shadow-md'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  {item.name}
                  <ConsumptionLimitWarning resourceId={item.resource.id} />
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-2'>
                <div className='text-muted-foreground flex items-center justify-between'>
                  Amount
                  <div className='text-foreground font-medium'>{item.value}</div>
                </div>
                <div className='text-muted-foreground flex items-center justify-between'>
                  Unit
                  <ResourceUnit type={item.resource} />
                </div>
              </CardContent>
              <CardFooter className='flex w-full justify-end gap-2 border-t pt-4'>
                <ConsumptionDeleteButton id={item.id} date={item.date} />
                <ConsumptionEditButton data={item} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
