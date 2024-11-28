import * as React from 'react';
import { Link } from '@tanstack/react-router';

import { CommandMenu } from '@/app/root/command-menu';
import { mainNav } from '@/app/root/constants';
import { NavMain } from '@/app/root/nav-main';
import { NavSecondary } from '@/app/root/nav-secondary';
import { NavUser } from '@/app/root/nav-user';
import { Icons } from '@/shared/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { siteConfig } from '@/shared/lib/constants';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size='lg'>
              <Link className='flex aspect-square items-center text-lg text-sidebar-foreground' to='/home'>
                <Icons.logo />
                <div className='truncate font-semibold'>{siteConfig.name}</div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size='lg'>
              <CommandMenu />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={mainNav} />
        <NavSecondary className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
