import * as accountsOptions from '@kijk/api/accounts/options';
import { createFileRoute } from '@tanstack/react-router';

import { AccountsSection } from '@/app/accounts/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/finances/accounts`: bank and cash accounts of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/accounts')({
  loader: ({ params: { spaceId }, context: { queryClient } }) =>
    queryClient.query({ ...accountsOptions.listQueryOptions(spaceId), staleTime: 'static' }),
  component: AccountsPage,
  errorComponent: RouteError,
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
