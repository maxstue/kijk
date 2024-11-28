import { Link } from '@tanstack/react-router';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';

interface Props {
  items: Array<{
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: Array<{
      title: string;
      url: string;
    }>;
  }>;
}

export function NavMain({ items }: Props) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <Link key={item.url} activeOptions={{ exact: true, includeSearch: false }} to={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
