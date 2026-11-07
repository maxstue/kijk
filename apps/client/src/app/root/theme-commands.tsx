import { useThemeStoreActions } from '@kijk/core/stores/theme-store';
import { CommandGroup, CommandItem } from '@kijk/ui/components/command';
import { Laptop, Moon, SunMedium } from 'lucide-react';

interface ThemeCommandsProps {
  runCommand: (command: () => unknown) => () => void;
}
export function ThemeCommands({ runCommand }: ThemeCommandsProps) {
  const { setMode } = useThemeStoreActions();
  return (
    <CommandGroup heading='Theme'>
      <CommandItem
        value='theme-light'
        onSelect={runCommand(() => {
          setMode('light');
        })}
      >
        <SunMedium className='mr-2 h-4 w-4' />
        Light
      </CommandItem>
      <CommandItem
        value='theme-dark'
        onSelect={runCommand(() => {
          setMode('dark');
        })}
      >
        <Moon className='mr-2 h-4 w-4' />
        Dark
      </CommandItem>
      <CommandItem
        value='theme-system'
        onSelect={runCommand(() => {
          setMode('system');
        })}
      >
        <Laptop className='mr-2 h-4 w-4' />
        System
      </CommandItem>
    </CommandGroup>
  );
}
