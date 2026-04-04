import * as React from "react";
import { Link } from "@tanstack/react-router";

import { NavMain } from "@/app/root/nav-main";
import { NavSecondary } from "@/app/root/nav-secondary";
import { NavUser } from "@/app/root/nav-user";

import { siteConfig } from "@/shared/lib/constants";
import { Icons } from "@kijk/ui/components/icons";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from "@kijk/ui/components/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/home">
                <Icons.logo className="size-5" />
                <div className="truncate text-base font-semibold">{siteConfig.name}</div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
