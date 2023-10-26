import { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme-store';

interface Props {
  children: ReactNode;
  className?: string;
}

export function ThemeWrapper({ children, className }: Props) {
  const { theme, radius } = useThemeStore();

  return (
    <div
      className={cn(`theme-${theme}`, 'w-full', className)}
      style={
        {
          '--radius': `${radius}rem`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
