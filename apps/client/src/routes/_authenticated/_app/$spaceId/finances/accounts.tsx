import * as accountsOptions from '@kijk/api/accounts/options';
import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

import { accountSort } from '@/app/accounts/columns';
import { AccountsSection } from '@/app/accounts/section';
import { RouteError } from '@/shared/components/errors/route-error';
import { Loader } from '@/shared/components/ui/loaders/loader';
import { tableSearchDefaults, tableSearchSchema, toTableQuery } from '@/shared/lib/table-query';

/** `/finances/accounts`: bank and cash accounts of the active space. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/finances/accounts')({
  validateSearch: tableSearchSchema,
  search: { middlewares: [stripSearchParams(tableSearchDefaults(accountSort))] },
  loaderDeps: ({ search }) => search,
  loader: ({ params: { spaceId }, context: { queryClient }, deps }) =>
    queryClient.query({
      ...accountsOptions.listQueryOptions(spaceId, toTableQuery(accountSort, deps)),
      staleTime: 'static',
    }),
  component: AccountsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Accounts' }] }),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});

function AccountsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div data-guide='accounts' className='space-y-6 pt-6'>
      <AccountsSection
        search={search}
        onSearchChange={(change, options) =>
          void navigate({ search: (previous) => ({ ...previous, ...change }), replace: options?.replace })
        }
      />
    </div>
  );
}
