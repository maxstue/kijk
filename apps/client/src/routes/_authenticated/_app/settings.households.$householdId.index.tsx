import { createFileRoute } from '@tanstack/react-router';

import { HouseholdOverview } from '@/app/settings/households/overview';

/** `/settings/households/$householdId/`: household settings overview. */
export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/')({
  component: HouseholdOverview,
});
