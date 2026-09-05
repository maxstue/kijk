import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';

export function ConsumptionLimitWarnings() {
  const { data } = useSuspenseQuery(consumptionLimitsQueryOptions());

  useEffect(() => {
    data.forEach((limit) => {
      const toastId = `consumption-limit-${limit.id}`;

      if (!limit.active || !limit.isExceeded) {
        toast.dismiss(toastId);
        return;
      }

      toast.warning(`${limit.name} has been reached`, {
        closeButton: true,
        description: `${Number(limit.actualValue).toLocaleString()} of ${Number(limit.limit).toLocaleString()} ${limit.resource.unit} used this ${limit.period.toLowerCase()}.`,
        duration: 5_000,
        dismissible: true,
        id: toastId,
      });
    });
  }, [data]);

  return null;
}
