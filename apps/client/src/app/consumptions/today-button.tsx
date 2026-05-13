import { Button } from '@kijk/ui/components/button';
import { getRouteApi } from '@tanstack/react-router';

import { months } from '@/shared/utils/months';

const Route = getRouteApi('/_protected/consumptions');

export function ConsumptionTodayButton() {
  const navigate = Route.useNavigate();

  const handleClick = () => {
    navigate({
      search: (previous) => ({
        ...previous,
        month: months[new Date().getMonth()],
        year: new Date().getFullYear(),
      }),
    });
  };

  return (
    <Button variant='outline' onClick={handleClick}>
      Current month
    </Button>
  );
}
