import type { components } from '@kijk/api/generated/kijk';
import * as usersOptions from '@kijk/api/users/options';
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
import { LogoIcon } from '@kijk/ui/components/icons';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@kijk/ui/components/sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useRouter } from '@tanstack/react-router';
import {
  Check,
  ChevronsUpDown,
  ExternalLinkIcon,
  LockIcon,
  LogOut,
  SendIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';

import { FeedbackDialog } from '@/app/root/feedback-dialog';
import { getInitialChars } from '@/app/root/helpers';
import { siteConfig } from '@/shared/config/site';
import { useAppAuth } from '@/shared/runtime/auth';

/** Sidebar account menu: settings, feedback and sign-out. */
export function AccountMenu() {
  const { signOut } = useAppAuth();
  const { data: currentAccount } = useQuery(usersOptions.meQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: '/' });
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [showFeedback, setShowFeedback] = useState(false);
  const { spaceId } = useParams({ strict: false });
  const account = getAccountMenuData(currentAccount?.user, spaceId);

  const handleSignOut = () => {
    signOut()
      .then(async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
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
        spaces={currentAccount?.user?.spaces ?? []}
      />
      <FeedbackDialog onClose={() => setShowFeedback(false)} />
    </Dialog>
  );
}

type CurrentUser = components['schemas']['GetMeUserResponse'];

interface AccountMenuData {
  displayName?: string | null;
  email?: string | null;
  spaceName: string;
  imageUrl?: string | null;
  initials: string;
}

function getAccountMenuData(user?: CurrentUser, spaceId?: string): AccountMenuData {
  const displayName = getDisplayName(user);
  const email = getEmail(user);

  return {
    displayName,
    email,
    spaceName: getActiveSpaceName(user, spaceId),
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

function getActiveSpaceName(user?: CurrentUser, spaceId?: string) {
  return user?.spaces?.find((space) => space.id === spaceId)?.name ?? siteConfig.name;
}

type Space = NonNullable<CurrentUser['spaces']>[number];

interface AccountMenuDropdownProps {
  account: AccountMenuData;
  spaces: Space[];
  isMobile: boolean;
  onNavigateToSettings: () => void;
  onOpenFeedback: () => void;
  onSignOut: () => void;
}

function AccountMenuDropdown({
  account,
  isMobile,
  onNavigateToSettings,
  onOpenFeedback,
  onSignOut,
  spaces,
}: AccountMenuDropdownProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                tooltip={account.spaceName}
              />
            }
          >
            <LogoIcon className='text-sidebar-foreground size-5 shrink-0' />
            <span className='truncate font-medium'>{account.spaceName}</span>
            <ChevronsUpDown className='ml-auto size-3.5' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            className='w-(--anchor-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <div className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <UserSummary
                  displayName={account.displayName}
                  email={account.email}
                  imageUrl={account.imageUrl}
                  initials={account.initials}
                />
              </div>
            </div>
            <DropdownMenuSeparator />
            <SpaceSwitcher spaces={spaces} />
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onNavigateToSettings}>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <a href={siteConfig.links.support} rel='noopener noreferrer' target='_blank'>
                    <ExternalLinkIcon />
                    Support
                  </a>
                }
              />
              <DropdownMenuItem onClick={onOpenFeedback}>
                <SendIcon />
                Give feedback
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
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

/** Lists the user's spaces, personal first, and switches the active one. */
function SpaceSwitcher({ spaces }: { spaces: Space[] }) {
  const navigate = useNavigate();
  const { spaceId } = useParams({ strict: false });
  const sorted = spaces.toSorted((a, b) => Number(b.isPersonal) - Number(a.isPersonal) || a.name.localeCompare(b.name));

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className='text-muted-foreground text-xs'>Spaces</DropdownMenuLabel>
      {sorted.map((space) => (
        <DropdownMenuItem key={space.id} onClick={() => navigate({ to: '/$spaceId', params: { spaceId: space.id } })}>
          {space.isPersonal ? <LockIcon /> : <UsersIcon />}
          <span className='min-w-0 flex-1 truncate'>{space.name}</span>
          <span className='text-muted-foreground text-xs'>{space.isPersonal ? 'Private' : 'Shared'}</span>
          {space.id === spaceId && <Check aria-label='Active space' className='size-4' />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}
