import { Icons } from '@/components/icons';
import type { Route } from 'next';

export interface NavItem {
  title: string;
  href: Route | URL;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: keyof typeof Icons;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface MainNavItem extends NavItem {}

export interface SidebarNavItem extends NavItemWithChildren {}

export type MarketingConfig = {
  mainNav: MainNavItem[];
};

export type HomeConfig = {
  mainNav: MainNavItem[];
  sidebarNav: MainNavItem[];
};
