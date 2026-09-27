import { createFileRoute } from '@tanstack/react-router';

import { HouseholdOverview } from '@/app/settings/households/overview';

export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/')({
  component: HouseholdOverview,
});
