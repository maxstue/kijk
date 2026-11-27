import * as usersOptions from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { membershipPrivacyNote } from '@/app/inbox/constants';
import { InboxInvitations } from '@/app/inbox/invitations';
import { PageHeader, PageHeaderContent, PageHeaderDescription, PageHeaderTitle } from '@/shared/components/page-header';

/** `/inbox`: the current user's pending invitations to shared spaces. */
export const Route = createFileRoute('/_authenticated/_app/inbox')({
  // Not awaited: the list shows its own loading and error states.
  loader: ({ context: { queryClient } }) => void queryClient.prefetchQuery(usersOptions.invitationsQueryOptions()),
  component: InboxPage,
  head: () => ({ meta: [{ title: 'Inbox' }] }),
});

function InboxPage() {
  const { data: currentUser } = useQuery(usersOptions.meQueryOptions());
  const navigate = Route.useNavigate();
  return (
    <div className='mx-auto max-w-3xl space-y-6 pt-6'>
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Invitations</PageHeaderTitle>
          <PageHeaderDescription>{membershipPrivacyNote}</PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>
      <InboxInvitations
        email={currentUser?.identity?.email}
        onJoined={(spaceId) => void navigate({ params: { spaceId }, to: '/$spaceId' })}
      />
    </div>
  );
}
