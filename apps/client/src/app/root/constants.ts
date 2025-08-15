import { ChartAreaIcon, HousePlugIcon, LayoutDashboardIcon, TriangleAlertIcon } from 'lucide-react';

interface MainNavItem {
  title: string;
  url: string;
  icon: typeof HousePlugIcon;
  isActive: boolean;
}

export const mainNav = [
  {
    title: 'Home',
    url: '/home',
    icon: LayoutDashboardIcon,
    isActive: true,
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: ChartAreaIcon,
    isActive: false,
  },
  {
    title: 'Consumptions',
    url: '/consumptions',
    icon: HousePlugIcon,
    isActive: true,
  },
  {
    title: 'Limits',
    url: '/consumptions-limits',
    icon: TriangleAlertIcon,
    isActive: false,
  },
  {
    title: 'Resources',
    url: '/resources',
    icon: HousePlugIcon,
    isActive: false,
  },
] satisfies Array<MainNavItem>;
