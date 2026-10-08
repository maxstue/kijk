import {
  ChartAreaIcon,
  HousePlugIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  TagsIcon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';

interface MainNavItem {
  title: string;
  url: string;
  icon: typeof HousePlugIcon;
  isActive: boolean;
}

interface MainNavGroup {
  label: string;
  items: MainNavItem[];
}

/** Groups of the main navigation: general pages, resource tracking and finances. */
export const mainNavGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboardIcon, isActive: true, title: 'Home', url: '/home' },
      { icon: ChartAreaIcon, isActive: false, title: 'Analytics', url: '/analytics' },
    ],
  },
  {
    label: 'Consumption',
    items: [
      { icon: HousePlugIcon, isActive: true, title: 'Consumptions', url: '/consumptions' },
      { icon: TriangleAlertIcon, isActive: true, title: 'Limits', url: '/limits' },
      { icon: HousePlugIcon, isActive: true, title: 'Resources', url: '/resources' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { icon: PiggyBankIcon, isActive: true, title: 'Budgets', url: '/finances/budgets' },
      { icon: ReceiptTextIcon, isActive: true, title: 'Transactions', url: '/finances/transactions' },
      { icon: LandmarkIcon, isActive: true, title: 'Accounts', url: '/finances/accounts' },
      { icon: TagsIcon, isActive: true, title: 'Categories', url: '/finances/categories' },
      { icon: UploadIcon, isActive: true, title: 'Imports', url: '/finances/imports' },
    ],
  },
] satisfies MainNavGroup[];
