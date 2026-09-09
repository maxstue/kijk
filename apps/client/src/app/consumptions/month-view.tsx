import { Badge } from '@kijk/ui/components/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { format, parseISO } from 'date-fns';
import { Suspense } from 'react';

import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionLimitWarning } from '@/app/consumptions/limit-warning';
import ConsumptionStats from '@/app/consumptions/stats';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { Loader } from '@/shared/components/ui/loaders/loader';
import type { Consumption } from '@/shared/types/domain';
import { ValueTypes } from '@/shared/types/domain';

export function ConsumptionMonthView({ consumptions }: { consumptions: Consumption[] }) {
  const sortedConsumptions = consumptions.toSorted((left, right) => right.date.localeCompare(left.date));

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
          {sortedConsumptions.map((item) => (
            <Card key={item.id} className='transition-shadow hover:shadow-md'>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <CardTitle className='flex items-center gap-2'>
                    {item.name}
                    <ConsumptionLimitWarning resourceId={item.resource.id} />
                  </CardTitle>
                  <Badge variant='secondary'>{format(parseISO(item.date), 'dd.MM.yyyy')}</Badge>
                </div>
              </CardHeader>
              <CardContent className='flex flex-col gap-2'>
                <div className='text-muted-foreground flex items-center justify-between'>
                  {item.valueType === ValueTypes.ABSOLUTE ? 'Meter reading' : 'Entered consumption'}
                  <div className='text-foreground font-medium'>
                    {item.value} <ResourceUnit type={item.resource} />
                  </div>
                </div>
                <div className='text-muted-foreground flex items-center justify-between'>
                  Calculated consumption
                  <div className='text-foreground font-medium'>
                    {item.calculatedConsumption} <ResourceUnit type={item.resource} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className='flex w-full justify-end gap-2 border-t pt-4'>
                <ConsumptionDeleteButton id={item.id} date={item.date} />
                <ConsumptionEditButton id={item.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
