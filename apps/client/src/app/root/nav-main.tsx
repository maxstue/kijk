import { cn } from '@kijk/core/utils/style';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@kijk/ui/components/sidebar';
import { Link } from '@tanstack/react-router';

import { CommandMenu } from '@/app/root/command-menu';
import { mainNav } from '@/app/root/constants';

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-4'>
        <SidebarMenu className='flex flex-row items-center justify-between gap-2'>
          <SidebarMenuItem className='w-full'>
            <SidebarMenuButton asChild size='sm'>
              <CommandMenu />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {mainNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link
                  key={item.url}
                  activeOptions={{ exact: false }}
                  className={cn(!item.isActive && 'cursor-not-allowed')}
                  disabled={!item.isActive}
                  to={item.url}
                  activeProps={{
                    className: 'text-primary-foreground bg-primary',
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
  );
}
