import { HomeConfig } from '@/types/nav';

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
      href: '/profile',
      icon: 'user',
    },
    {
      title: 'Teams',
      href: '/teams',
      icon: 'users',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: 'settings',
    },
  ],
};
