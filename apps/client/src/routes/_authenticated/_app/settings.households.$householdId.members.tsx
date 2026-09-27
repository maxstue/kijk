import { createFileRoute } from '@tanstack/react-router';

import { HouseholdMembers } from '@/app/settings/households/members';

export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/members')({
  component: HouseholdMembers,
});
