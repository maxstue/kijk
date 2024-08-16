import { useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useThemeStoreActions } from '@/shared/stores/theme-store';

export function ThemeModeToggle() {
  const { setMode } = useThemeStoreActions();

  const handleModeChange = useCallback(
    (mode: 'light' | 'dark' | 'system') => () => {
      setMode(mode);
    },
    [setMode],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleModeChange('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={handleModeChange('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={handleModeChange('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
