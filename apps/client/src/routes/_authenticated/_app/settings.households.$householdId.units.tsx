import { createFileRoute } from '@tanstack/react-router';

import { HouseholdBackLink } from '@/app/settings/households/back-link';
import { useHouseholdSettings } from '@/app/settings/households/context';
import { UnitsSection } from '@/app/settings/units/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

export const Route = createFileRoute('/_authenticated/_app/settings/households/$householdId/units')({
  component: HouseholdUnitsPage,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function HouseholdUnitsPage() {
  const { household } = useHouseholdSettings();
  useSetSiteHeader('Household units');
  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <HouseholdBackLink />
      <UnitsSection householdId={household.id} key={household.id} scope='household' />
    </div>
  );
}
