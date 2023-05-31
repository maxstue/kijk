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
