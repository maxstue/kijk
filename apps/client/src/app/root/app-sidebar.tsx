import { Sidebar, SidebarContent, SidebarHeader } from '@kijk/ui/components/sidebar';
import { useRouterState } from '@tanstack/react-router';
import * as React from 'react';

import { AccountMenu } from '@/app/root/account-menu';
import { NavMain } from '@/app/root/nav-main';
import { SettingsNav } from '@/app/root/settings-nav';

interface Props extends React.ComponentProps<typeof Sidebar> {}

export function AppSidebar({ ...props }: Props) {
  const isSettingsRoute = useRouterState({
    select: (state) => state.location.pathname.startsWith('/settings'),
  });

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <AccountMenu />
      </SidebarHeader>
      <SidebarContent>{isSettingsRoute ? <SettingsNav /> : <NavMain />}</SidebarContent>
    </Sidebar>
  );
}
