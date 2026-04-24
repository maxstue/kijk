import { ChartAreaIcon, HousePlugIcon, LayoutDashboardIcon, TriangleAlertIcon } from 'lucide-react';

interface MainNavItem {
  title: string;
  url: string;
  icon: typeof HousePlugIcon;
  isActive: boolean;
}

export const mainNav = [
  {
    icon: LayoutDashboardIcon,
    isActive: true,
    title: 'Home',
    url: '/home',
  },
  {
    icon: ChartAreaIcon,
    isActive: false,
    title: 'Analytics',
    url: '/analytics',
  },
  {
    icon: HousePlugIcon,
    isActive: true,
    title: 'Consumptions',
    url: '/consumptions',
  },
  {
    icon: TriangleAlertIcon,
    isActive: false,
    title: 'Limits',
    url: '/consumptions-limits',
  },
  {
    icon: HousePlugIcon,
    isActive: false,
    title: 'Resources',
    url: '/resources',
  },
] satisfies MainNavItem[];
