import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { HousePlug, Laptop, LayoutDashboard, Moon, SunMedium } from 'lucide-react';

import type { Dialog } from 'radix-ui';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command';
import { DialogDescription, DialogTitle } from '@/shared/components/ui/dialog';
import { settingsNav } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/helpers';
import { useThemeStoreActions } from '@/shared/stores/theme-store';
import { months } from '@/shared/types/app';

interface Props extends Dialog.DialogProps {
  isCollapsed?: boolean;
}

export function CommandMenu({ ...props }: Props) {
  const navigate = useNavigate({ from: '/' });
  const [open, setOpen] = useState(false);
  const { setMode } = useThemeStoreActions();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener('keydown', down);
    return () => {
      document.removeEventListener('keydown', down);
    };
  }, []);

  const runCommand = useCallback(
    (command: () => unknown) => () => {
      setOpen(false);
      command();
    },
    [],
  );

  const handleOpen = useCallback(
    (value: boolean) => () => {
      setOpen(value);
    },
    [],
  );

  return (
    <>
      <Button
        variant='outline'
        className={cn(
          'group text-muted-foreground relative h-9 w-full justify-start text-sm',
          props.isCollapsed ? 'p-1' : 'sm:pr-12',
        )}
        onClick={handleOpen(true)}
      >
        {props.isCollapsed ? undefined : <span className='inline-flex'>Search...</span>}

        <kbd
          className={cn(
            'pointer-events-none absolute top-2 hidden h-5 items-center gap-1 rounded-sm px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex',
            props.isCollapsed ? 'right-0' : 'bg-muted group-hover:bg-background right-1.5',
          )}
        >
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle aria-hidden className='hidden'>
          Command Menu
        </DialogTitle>
        <DialogDescription aria-hidden className='hidden'>
          Command menu
        </DialogDescription>
        <CommandInput placeholder='Search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading='Links'>
            <CommandItem key='Home' onSelect={runCommand(() => navigate({ to: '/' }))}>
              <LayoutDashboard />
              Home
            </CommandItem>
            <CommandItem
              key='resource'
              onSelect={runCommand(() =>
                navigate({
                  to: '/consumptions',
                  search: (previous) => ({
                    ...previous,
                    month: months[new Date().getMonth()],
                    year: new Date().getFullYear(),
                  }),
                }),
              )}
            >
              <HousePlug />
              Resource
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandSeparator />
          <CommandGroup heading='Settings'>
            {settingsNav.map((item) => {
              const Icon = Icons[item.icon];
              return (
                <CommandItem
                  key={item.label}
                  onSelect={runCommand(() => navigate({ to: '/settings/$section', params: { section: item.to } }))}
                >
                  <Icon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
