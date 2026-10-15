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
  /** Only highlight on the exact URL, e.g. when sibling pages live below it. */
  exact?: boolean;
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
      { icon: LayoutDashboardIcon, isActive: true, title: 'Home', url: '/$spaceId', exact: true },
      { icon: ChartAreaIcon, isActive: false, title: 'Analytics', url: '/analytics' },
    ],
  },
  {
    label: 'Consumption',
    items: [
      { icon: HousePlugIcon, isActive: true, title: 'Consumptions', url: '/$spaceId/consumptions', exact: true },
      { icon: TriangleAlertIcon, isActive: true, title: 'Limits', url: '/$spaceId/consumptions/limits' },
      { icon: HousePlugIcon, isActive: true, title: 'Resources', url: '/$spaceId/consumptions/resources' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { icon: PiggyBankIcon, isActive: true, title: 'Budgets', url: '/$spaceId/finances/budgets' },
      { icon: ReceiptTextIcon, isActive: true, title: 'Transactions', url: '/$spaceId/finances/transactions' },
      { icon: LandmarkIcon, isActive: true, title: 'Accounts', url: '/$spaceId/finances/accounts' },
      { icon: TagsIcon, isActive: true, title: 'Categories', url: '/$spaceId/finances/categories' },
      { icon: UploadIcon, isActive: true, title: 'Imports', url: '/$spaceId/finances/imports' },
    ],
  },
] satisfies MainNavGroup[];
