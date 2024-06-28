import { Icons } from '@/components/icons';
import type { Route } from 'next';

// ##### Ts extension types #####
export type Optional<T> = T | undefined | null;
export type Id<T = string> = T;

export interface NavItem {
  title: string;
  href: Route | URL;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: keyof typeof Icons;
}
