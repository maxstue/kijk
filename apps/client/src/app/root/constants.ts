import { HousePlug, LayoutDashboard, Settings2, WalletMinimal } from 'lucide-react';

export const mainNav = [
  {
    title: 'Overview',
    url: '/home',
    icon: LayoutDashboard,
  },
  {
    title: 'Energy',
    url: '/energy',
    icon: HousePlug,
  },
  {
    title: 'Budget',
    url: '/budget',
    icon: WalletMinimal,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2,
  },
];
