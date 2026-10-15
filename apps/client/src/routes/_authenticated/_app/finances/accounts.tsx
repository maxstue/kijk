import { accountsQueryOptions } from '@kijk/api/accounts/options';
import { createFileRoute } from '@tanstack/react-router';

import { AccountsSection } from '@/app/accounts/section';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/finances/accounts`: bank and cash accounts of the active space. */
export const Route = createFileRoute('/_authenticated/_app/finances/accounts')({
  loader: ({ context: { queryClient } }) => queryClient.query({ ...accountsQueryOptions(), staleTime: 'static' }),
  component: AccountsPage,
  errorComponent: ({ error, info }) => <AppError error={error} info={info} />,
  head: () => ({ meta: [{ title: 'Accounts' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function AccountsPage() {
  return (
    <div className='space-y-6 pt-6'>
      <AccountsSection />
    </div>
  );
}
