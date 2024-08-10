import { getRouteApi } from '@tanstack/react-router';

import { Button } from '@/shared/components/ui/button';
import { months } from '@/shared/types/app';

const Route = getRouteApi('/_protected/budget');

export function BudgetTodayButton() {
  const navigate = Route.useNavigate();

  const handleClick = () => {
    navigate({
      search: (previous) => ({ ...previous, month: months[new Date().getMonth()], year: new Date().getFullYear() }),
    });
  };

  return (
    <Button variant='outline' onClick={handleClick}>
      Today
    </Button>
  );
}
