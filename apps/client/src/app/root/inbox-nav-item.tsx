import * as usersOptions from '@kijk/api/users/options';
import { SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from '@kijk/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { InboxIcon } from 'lucide-react';

/** Link to the inbox with the number of pending invitations. */
export function InboxNavItem() {
  const { data: count = 0 } = useQuery({
    ...usersOptions.invitationsQueryOptions(),
    select: (invitations) => invitations.length,
  });
  const label = count === 1 ? '1 pending invitation' : `${count} pending invitations`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            aria-label={count > 0 ? `Inbox, ${label}` : undefined}
            activeProps={{ className: 'bg-primary text-primary-foreground' }}
            to='/inbox'
          />
        }
      >
        <InboxIcon />
        <span>Inbox</span>
      </SidebarMenuButton>
      {count > 0 && <SidebarMenuBadge aria-hidden>{count}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}
