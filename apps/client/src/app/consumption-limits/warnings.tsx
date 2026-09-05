import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { useSuspenseQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';

import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';

export function ConsumptionLimitWarnings() {
  const { data } = useSuspenseQuery(consumptionLimitsQueryOptions());
  const exceededLimits = data.filter((limit) => limit.active && limit.isExceeded);

  if (exceededLimits.length === 0) return null;

  return (
    <div className='space-y-3'>
      {exceededLimits.map((limit) => (
        <Alert key={limit.id} variant='destructive'>
          <TriangleAlert />
          <AlertTitle>{limit.name} has been reached</AlertTitle>
          <AlertDescription>
            {Number(limit.actualValue).toLocaleString()} of {Number(limit.limit).toLocaleString()} {limit.resource.unit}{' '}
            used this {limit.period.toLowerCase()}.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
