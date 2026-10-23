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
import { useNavGroups } from '@/app/root/use-nav-groups';
import { useNavigationSpaceId } from '@/shared/hooks/use-active-space';

/** Main navigation of the sidebar: the command menu followed by one group per area. */
export function NavMain() {
  const spaceId = useNavigationSpaceId();
  const navGroups = useNavGroups();
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem className='w-full'>
              <SidebarMenuButton render={<CommandMenu />} size='sm' />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {navGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link
                        activeOptions={{ exact: 'exact' in item && item.exact }}
                        className={cn(!item.isActive && 'cursor-not-allowed')}
                        disabled={!item.isActive || !spaceId}
                        params={{ spaceId }}
                        to={item.url}
                        activeProps={{
                          className: 'bg-primary text-primary-foreground',
                        }}
                      />
                    }
                  >
                    <item.icon />
                    <span>{item.title}</span>
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
