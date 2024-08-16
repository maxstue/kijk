import { LayoutIcon, LibraryIcon } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface Mode {
  param: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const modes: Mode[] = [
  {
    param: 'developer',
    name: 'Developer',
    description: 'The core library',
    icon: LibraryIcon,
  },
  {
    param: 'user',
    name: 'User',
    description: 'The user interface',
    icon: LayoutIcon,
  },
];
