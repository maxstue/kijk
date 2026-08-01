import { useAuth } from '@clerk/react';
import { Avatar, AvatarFallback, AvatarImage } from '@kijk/ui/components/avatar';
import { Dialog } from '@kijk/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Icons } from '@kijk/ui/components/icons';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@kijk/ui/components/sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronsUpDown, ExternalLinkIcon, LogOut, SendIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';

import { FeedbackDialog } from '@/app/root/feedback-dialog';
import { getInitialChars } from '@/app/root/helpers';
import type { components } from '@/shared/api/generated/kijk';
import { queryKeys } from '@/shared/api/query-keys';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { siteConfig } from '@/shared/config/site';

export function AccountMenu() {
  const { signOut } = useAuth();
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: '/' });
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [showFeedback, setShowFeedback] = useState(false);
  const account = getAccountMenuData(currentAccount?.user);

  const handleSignOut = (event: Event) => {
    event.preventDefault();
    signOut()
      .then(() => {
        queryClient.removeQueries({ queryKey: queryKeys.users.me });
        return router.invalidate();
      })
      .then(() => navigate({ replace: true, to: '/auth' }))
      .catch(console.warn);
  };

  return (
    <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
      <AccountMenuDropdown
        account={account}
        isMobile={isMobile}
        onNavigateToSettings={() => navigate({ to: '/settings' })}
        onOpenFeedback={() => setShowFeedback(true)}
        onSignOut={handleSignOut}
      />
      <FeedbackDialog onClose={() => setShowFeedback(false)} />
    </Dialog>
  );
}

type CurrentUser = components['schemas']['GetMeUserResponse'];

interface AccountMenuData {
  displayName?: string | null;
  email?: string | null;
  householdName: string;
  imageUrl?: string | null;
  initials: string;
}

function getAccountMenuData(user?: CurrentUser): AccountMenuData {
  const displayName = getDisplayName(user);
  const email = getEmail(user);

  return {
    displayName,
    email,
    householdName: getActiveHouseholdName(user),
    imageUrl: getImageUrl(user),
    initials: getInitialChars(getIdentityLabel(displayName, email)),
  };
}

function getDisplayName(user?: CurrentUser) {
  return user?.externalIdentity?.fullName ?? user?.name;
}

function getEmail(user?: CurrentUser) {
  return user?.externalIdentity?.email;
}

function getImageUrl(user?: CurrentUser) {
  return user?.externalIdentity?.imageUrl;
}

function getIdentityLabel(displayName?: string | null, email?: string | null) {
  return displayName ?? email ?? undefined;
}

function getActiveHouseholdName(user?: CurrentUser) {
  return user?.households?.find((household) => household.isActive)?.name ?? siteConfig.name;
}

interface AccountMenuDropdownProps {
  account: AccountMenuData;
  isMobile: boolean;
  onNavigateToSettings: () => void;
  onOpenFeedback: () => void;
  onSignOut: (event: Event) => void;
}

function AccountMenuDropdown({
  account,
  isMobile,
  onNavigateToSettings,
  onOpenFeedback,
  onSignOut,
}: AccountMenuDropdownProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              tooltip={account.householdName}
            >
              <Icons.logo className='text-sidebar-foreground size-5 shrink-0' />
              <span className='truncate font-medium'>{account.householdName}</span>
              <ChevronsUpDown className='ml-auto size-3.5' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <UserSummary
                  displayName={account.displayName}
                  email={account.email}
                  imageUrl={account.imageUrl}
                  initials={account.initials}
                />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onNavigateToSettings}>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={siteConfig.links.support} rel='noopener noreferrer' target='_blank'>
                  <ExternalLinkIcon />
                  Support
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onOpenFeedback}>
                <SendIcon />
                Give feedback
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

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
