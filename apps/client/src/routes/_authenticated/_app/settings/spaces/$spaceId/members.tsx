import * as spacesOptions from '@kijk/api/spaces/options';
import { createFileRoute } from '@tanstack/react-router';

import { SpaceMembers } from '@/app/settings/spaces/members';
import { AppError } from '@/shared/components/errors/app-error';
import { Loader } from '@/shared/components/ui/loaders/loader';

/** `/settings/spaces/$spaceId/members`: members and roles; preloads members and roles. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/members')({
  component: SpaceMembers,
  errorComponent: ({ info, error }) => <AppError error={error} info={info} />,
  loader: ({ context: { queryClient }, params: { spaceId } }) =>
    Promise.all([
      queryClient.query({ ...spacesOptions.membersQueryOptions(spaceId), staleTime: 'static' }),
      queryClient.query({ ...spacesOptions.rolesQueryOptions(), staleTime: 'static' }),
    ]),
  pendingComponent: () => <Loader className='h-6 w-6' />,
});
