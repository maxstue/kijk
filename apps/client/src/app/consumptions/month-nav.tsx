import { getRouteApi } from '@tanstack/react-router';

import { MonthSwitcher } from '@/shared/components/month-switcher';
import { getMonthFromIndex, getMonthNumber } from '@/shared/utils/months';

const Route = getRouteApi('/_authenticated/_app/$spaceId/consumptions/_overview');

/** Month navigation that updates the `month` and `year` search params. */
export function ConsumptionMonthNav() {
  const { month, year } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MonthSwitcher
      month={getMonthNumber(month)}
      year={year}
      onChange={(value) =>
        navigate({
          search: (previous) => ({ ...previous, month: getMonthFromIndex(value.month - 1), year: value.year }),
        })
      }
    />
  );
}
