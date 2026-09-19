import { Badge } from '@kijk/ui/components/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { format, parseISO } from 'date-fns';
import { InfoIcon, RefreshCcw } from 'lucide-react';
import { Suspense } from 'react';

import { ConsumptionDeleteButton } from '@/app/consumptions/delete-button';
import { ConsumptionEditButton } from '@/app/consumptions/edit-button';
import { ConsumptionExportButton } from '@/app/consumptions/export-button';
import { ConsumptionLimitWarning } from '@/app/consumptions/limit-warning';
import ConsumptionStats from '@/app/consumptions/stats';
import { ResourceUnit } from '@/shared/components/resources-unit';
import { Loader } from '@/shared/components/ui/loaders/loader';
import type { Consumption } from '@/shared/types/domain';
import { ValueTypes } from '@/shared/types/domain';
import type { Months } from '@/shared/utils/months';

interface Props {
  consumptions: Consumption[];
  month: Months;
  year: number;
}

export function ConsumptionMonthView({ consumptions, month, year }: Props) {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <ConsumptionStats />
      </Suspense>
      <section aria-labelledby='consumption-entries-heading' className='space-y-4'>
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <h3 id='consumption-entries-heading' className='text-lg font-semibold tracking-tight'>
              Consumption entries
            </h3>
            <p className='text-muted-foreground text-sm'>Individual records for this month.</p>
          </div>
          <ConsumptionExportButton disabled={consumptions.length === 0} month={month} year={year} />
        </div>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {consumptions.map((item) => (
            <Card
              key={item.id}
              className={
                item.startsNewMeterSegment
                  ? 'bg-primary/5 ring-primary/20 border-0 shadow-sm ring-1 transition-shadow hover:shadow-md'
                  : 'transition-shadow hover:shadow-md'
              }
            >
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-2'>
                    <CardTitle className='flex items-center gap-2'>
                      {item.name}
                      <ConsumptionLimitWarning resourceId={item.resource.id} />
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      {item.startsNewMeterSegment ? (
                        <Badge className='bg-primary/10 text-primary gap-1 border-0' variant='secondary'>
                          <RefreshCcw className='size-3' />
                          Meter reset
                        </Badge>
                      ) : undefined}
                      <Badge variant='outline'>
                        {item.valueType === ValueTypes.ABSOLUTE ? 'Meter reading' : 'Direct consumption entry'}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            aria-label={`Explain ${item.valueType === ValueTypes.ABSOLUTE ? 'meter reading' : 'direct consumption entry'}`}
                          >
                            <InfoIcon className='text-muted-foreground size-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='max-w-72 text-sm'>
                            {item.valueType === ValueTypes.ABSOLUTE
                              ? 'A meter reading is the cumulative value currently shown on the meter.'
                              : 'A direct consumption entry is added to the last known meter reading to calculate the running total.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Badge variant='secondary'>{format(parseISO(item.date), 'dd.MM.yyyy')}</Badge>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-2 gap-y-3'>
                <div className='text-muted-foreground min-w-0'>
                  {item.valueType === ValueTypes.ABSOLUTE ? 'Recorded meter reading' : 'Recorded consumption'}
                </div>
                <div className='text-foreground min-w-[4ch] text-right font-medium tabular-nums'>{item.value}</div>
                <ResourceUnit type={item.resource} />
                <div className='text-muted-foreground/80 min-w-0 text-sm'>Running meter total</div>
                <div className='text-muted-foreground min-w-[4ch] text-right text-sm tabular-nums'>
                  {item.calculatedMeterReading ?? '—'}
                </div>
                {item.calculatedMeterReading == null ? <span /> : <ResourceUnit type={item.resource} />}
              </CardContent>
              <CardFooter
                className={`flex w-full justify-between gap-2 border-t pt-4 ${item.startsNewMeterSegment ? 'border-primary/15' : ''}`}
              >
                <ConsumptionExportButton consumptionId={item.id} />
                <div className='flex gap-2'>
                  <ConsumptionDeleteButton id={item.id} date={item.date} />
                  <ConsumptionEditButton id={item.id} />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
