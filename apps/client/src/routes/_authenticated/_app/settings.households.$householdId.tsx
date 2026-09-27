import { Outlet, createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { HouseholdSettingsContext } from '@/app/settings/households/context';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId')({
  component: HouseholdSettingsPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  loader: async ({ context: { queryClient }, params: { householdId } }) => {
    const account = await queryClient.ensureQueryData(currentUserQueryOptions());
    const user = account.user;
    const household = user?.households?.find((entry) => entry.id === householdId);
    if (!user || !household) {
      throw notFound();
    }
    return { household, user };
  },
  notFoundComponent: () => <p className='text-muted-foreground'>This household is not available to your account.</p>,
  parseParams: (parameters) => ({ householdId: z.string().uuid().parse(parameters.householdId) }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function HouseholdSettingsPage() {
  const value = Route.useLoaderData();
  useSetSiteHeader(value.household.name);

  return (
    <HouseholdSettingsContext value={value}>
      <Outlet />
    </HouseholdSettingsContext>
  );
}
