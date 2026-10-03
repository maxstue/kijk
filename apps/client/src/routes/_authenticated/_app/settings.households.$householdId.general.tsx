import { createFileRoute } from '@tanstack/react-router';

import { HouseholdGeneral } from '@/app/settings/households/general';

/** `/settings/households/$householdId/general`: household details and deletion. */
export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/general')({
  component: HouseholdGeneral,
});
