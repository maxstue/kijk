import { createFileRoute } from '@tanstack/react-router';

import { HouseholdGeneral } from '@/app/settings/households/general';

export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/general')({
  component: HouseholdGeneral,
});
