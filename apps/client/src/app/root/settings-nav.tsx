import * as usersOptions from '@kijk/api/users/options';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@kijk/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon, LockIcon, UsersIcon } from 'lucide-react';

import { useNavigationSpaceId } from '@/shared/hooks/use-active-space';
import { settingsNavGroups } from '@/shared/navigation/settings';

/** Sidebar navigation of the settings pages, including one entry per space. */
export function SettingsNav() {
  const spaceId = useNavigationSpaceId();
  const { data: currentAccount } = useQuery(usersOptions.meQueryOptions());
  const spaces = currentAccount?.user?.spaces ?? [];
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={spaceId ? <Link to='/$spaceId' params={{ spaceId }} /> : <Link to='/' />}>
                <ArrowLeftIcon />
                <span>Back to app</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {settingsNavGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label === 'Space' ? 'Spaces' : group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.label === 'Space'
                ? spaces.map((space) => (
                    <SidebarMenuItem key={space.id}>
                      <SidebarMenuButton
                        render={
                          <Link
                            activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' }}
                            params={{ spaceId: space.id }}
                            to='/settings/spaces/$spaceId'
                          />
                        }
                      >
                        {space.isPersonal ? <LockIcon /> : <UsersIcon />}
                        <span>{space.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                : group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          render={
                            <Link
                              activeOptions={{ exact: true }}
                              activeProps={{
                                className: 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                              }}
                              params={{ section: item.to }}
                              to='/settings/$section'
                            />
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
