import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@kijk/ui/components/sidebar';
import { Link } from '@tanstack/react-router';
import { cn } from 'cn';

import { CommandMenu } from '@/app/root/command-menu';
import { mainNavGroups } from '@/app/root/constants';

/** Main navigation of the sidebar: the command menu followed by one group per area. */
export function NavMain() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem className='w-full'>
              <SidebarMenuButton asChild size='sm'>
                <CommandMenu />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {mainNavGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      activeOptions={{ exact: false }}
                      className={cn(!item.isActive && 'cursor-not-allowed')}
                      disabled={!item.isActive}
                      to={item.url}
                      activeProps={{
                        className: 'bg-primary text-primary-foreground',
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
