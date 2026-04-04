import { getRouteApi } from "@tanstack/react-router";

import { Button } from "@kijk/ui/components/button";
import { months } from "@/shared/types/app";

const Route = getRouteApi("/_protected/consumptions");

export function ConsumptionsTodayButton() {
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
    <Button variant="outline" onClick={handleClick}>
      Current month
    </Button>
  );
}
