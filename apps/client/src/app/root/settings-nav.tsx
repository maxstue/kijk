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

import { currentUserQueryOptions } from '@/shared/api/users/options';
import { settingsNavGroups } from '@/shared/navigation/settings';

/** Sidebar navigation of the settings pages, including one entry per household. */
export function SettingsNav() {
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const households = currentAccount?.user?.households ?? [];
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to='/home'>
                  <ArrowLeftIcon />
                  <span>Back to app</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {settingsNavGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label === 'Household' ? 'Spaces' : group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.label === 'Household'
                ? households.map((household) => (
                    <SidebarMenuItem key={household.id}>
                      <SidebarMenuButton asChild>
                        <Link
                          activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' }}
                          params={{ householdId: household.id }}
                          to='/settings/households/$householdId'
                        >
                          {household.isPersonal ? <LockIcon /> : <UsersIcon />}
                          <span>{household.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                : group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild>
                          <Link
                            activeOptions={{ exact: true }}
                            activeProps={{ className: 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' }}
                            params={{ section: item.to }}
                            to='/settings/$section'
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
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
