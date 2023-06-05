import { NavItem } from '@/types/nav';

type HomeConfig = {
  mainNav: NavItem[];
  sidebarNav: NavItem[];
};

export const homeConfig: HomeConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Wallet',
      href: '/wallet',
    },
    {
      title: 'Reports',
      href: '/',
      disabled: true,
    },
  ],
  sidebarNav: [
    {
      title: 'Profile',
      href: '/settings',
      icon: 'user',
    },
    {
      title: 'Account',
      href: '/settings/account',
      icon: 'settings',
    },
    {
      title: 'Appearance',
      href: '/settings/appearance',
      icon: 'monitor',
    },
    {
      title: 'Notifications',
      href: '/settings/notifications',
      icon: 'bellRing',
    },
  ],
};
