import { Button } from '@kijk/ui/components/button';
import { getRouteApi } from '@tanstack/react-router';

const Route = getRouteApi('/_authenticated/_app/consumptions');

export function ConsumptionCurrentYearButton() {
  const navigate = Route.useNavigate();

  const handleClick = () => {
    navigate({ search: (previous) => ({ ...previous, year: new Date().getFullYear() }) });
  };

  return (
    <Button variant='outline' onClick={handleClick}>
      Current year
    </Button>
  );
}
