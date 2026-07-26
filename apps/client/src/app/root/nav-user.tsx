import { useAuth } from '@clerk/react';
import { Avatar, AvatarFallback, AvatarImage } from '@kijk/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@kijk/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Bell, ChevronsUpDown, LogOut, Sparkles } from 'lucide-react';

import { getInitialChars } from '@/app/root/helpers';
import { currentUserQueryOptions } from '@/shared/api/users/options';

type UserSummaryProps = {
  displayName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  initials: string;
};

function UserSummary({ displayName, email, imageUrl, initials }: UserSummaryProps) {
  return (
    <>
      <Avatar className='h-8 w-8 rounded-lg'>
        <AvatarImage alt={displayName ?? initials} src={imageUrl ?? ''} />
        <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
      </Avatar>
      <div className='grid flex-1 text-left text-sm leading-tight'>
        <span className='truncate font-medium'>{displayName}</span>
        <span className='text-muted-foreground truncate text-xs'>{email}</span>
      </div>
    </>
  );
}

export function NavUser() {
  const { signOut } = useAuth();
  const { data: user } = useQuery(currentUserQueryOptions());
  const identity = user?.externalIdentity;
  const email = identity?.email;
  const displayName = identity?.fullName ?? user?.name;
  const userInitials = getInitialChars(displayName ?? email ?? undefined);
  const navigate = useNavigate({ from: '/' });
  const { isMobile } = useSidebar();

  const handleSignOut = (event: Event) => {
    event.preventDefault();
    signOut()
      .then(() => navigate({ replace: true, to: '/auth' }))
      .catch(console.warn);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              size='lg'
            >
              <UserSummary
                displayName={displayName}
                email={email}
                imageUrl={identity?.imageUrl}
                initials={userInitials}
              />
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <UserSummary
                  displayName={displayName}
                  email={email}
                  imageUrl={identity?.imageUrl}
                  initials={userInitials}
                />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
