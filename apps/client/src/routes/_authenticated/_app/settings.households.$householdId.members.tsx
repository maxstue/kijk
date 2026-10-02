import { createFileRoute } from '@tanstack/react-router';

import { HouseholdMembers } from '@/app/settings/households/members';
import { householdMembersQueryOptions, householdRolesQueryOptions } from '@/shared/api/households/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/settings/households/$householdId/members`: members and roles; preloads members and roles. */
export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/members')({
  component: HouseholdMembers,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  loader: ({ context: { queryClient }, params: { householdId } }) =>
    Promise.all([
      queryClient.ensureQueryData(householdMembersQueryOptions(householdId)),
      queryClient.ensureQueryData(householdRolesQueryOptions()),
    ]),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});
