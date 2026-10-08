import { createFileRoute } from '@tanstack/react-router';

import { AccountsSection } from '@/app/accounts/section';
import { accountsQueryOptions } from '@/shared/api/accounts/options';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

/** `/finances/accounts`: bank and cash accounts of the active space. */
export const Route = createFileRoute('/_authenticated/_app/finances/accounts')({
  component: AccountsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(accountsQueryOptions()),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function AccountsPage() {
  useSetSiteHeader('Accounts');

  return (
    <div className='space-y-6 pt-6'>
      <AccountsSection />
    </div>
  );
}
