import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';
import { useWarningToasts } from '@/shared/hooks/use-warning-toasts';

/**
 * Shows a warning toast for every exceeded active limit and dismisses it once the limit is no longer exceeded. Renders
 * nothing.
 */
export function ConsumptionLimitWarnings() {
  const { data } = useSuspenseQuery(consumptionLimitsQueryOptions());
  const warnings = useMemo(
    () =>
      data.map((limit) => ({
        active: limit.active && limit.isExceeded,
        description: `${Number(limit.actualValue).toLocaleString()} of ${Number(limit.limit).toLocaleString()} ${limit.resource.unit} used this ${limit.period.toLowerCase()}.`,
        id: `consumption-limit-${limit.id}`,
        title: `${limit.name} has been reached`,
      })),
    [data],
  );

  useWarningToasts(warnings);
  return null;
}
