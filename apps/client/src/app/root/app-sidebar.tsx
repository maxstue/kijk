import * as React from 'react';
import { Link } from '@tanstack/react-router';

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
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:!p-1.5'>
              <Link to='/home'>
                <Icons.logo className='size-5' />
                <div className='truncate text-base font-semibold'>{siteConfig.name}</div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSecondary className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
