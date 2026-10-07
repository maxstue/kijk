import {
  ChartAreaIcon,
  HousePlugIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  TriangleAlertIcon,
} from 'lucide-react';

interface MainNavItem {
  title: string;
  url: string;
  icon: typeof HousePlugIcon;
  isActive: boolean;
}

/** Entries of the main navigation. */
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
    isActive: true,
    title: 'Limits',
    url: '/limits',
  },
  {
    icon: PiggyBankIcon,
    isActive: true,
    title: 'Budgets',
    url: '/budgets',
  },
  {
    icon: ReceiptTextIcon,
    isActive: true,
    title: 'Transactions',
    url: '/transactions',
  },
  {
    icon: HousePlugIcon,
    isActive: true,
    title: 'Resources',
    url: '/resources',
  },
] satisfies MainNavItem[];
