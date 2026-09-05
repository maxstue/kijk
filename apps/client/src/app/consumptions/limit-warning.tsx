import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { useSuspenseQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';

import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';

interface Props {
  resourceId: string;
}

export function ConsumptionLimitWarning({ resourceId }: Props) {
  const { data } = useSuspenseQuery(consumptionLimitsQueryOptions());
  const exceededLimits = data.filter((limit) => limit.active && limit.isExceeded && limit.resource.id === resourceId);

  if (exceededLimits.length === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span aria-label='Limit(s) exceeded' className='inline-flex shrink-0 cursor-help' role='img'>
          <TriangleAlert aria-hidden='true' className='size-4 text-amber-600 dark:text-amber-400' />
        </span>
      </TooltipTrigger>
      <TooltipContent className='flex flex-col items-start justify-start space-y-1'>
        <p className='font-bold'>Limit(s) exceeded</p>
        {exceededLimits.map((limit) => (
          <p key={limit.id}>
            {limit.name}: {Number(limit.actualValue).toLocaleString()} of {Number(limit.limit).toLocaleString()}{' '}
            {limit.resource.unit} used this {limit.period.toLowerCase()}.
          </p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
