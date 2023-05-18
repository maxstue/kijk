'use client';

import * as React from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { DialogProps } from '@radix-ui/react-alert-dialog';
import { File, Laptop, Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/classnames';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { homeConfig } from '@/app/(home)/constants';

export function CommandMenu({ ...props }: DialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant='outline'
        className={cn(
          'relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64'
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className='hidden lg:inline-flex'>Search documentation...</span>
        <span className='inline-flex lg:hidden'>Search...</span>
        <kbd className='pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Type a command or search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading='Links'>
            <CommandItem
              key='Home'
              onSelect={() => {
                runCommand(() => router.push('/'));
              }}
            >
              <File className='mr-2 h-4 w-4' />
              Home
            </CommandItem>
            {homeConfig.mainNav
              .filter((navitem) => !navitem.external)
              .map((navItem) => (
                <CommandItem
                  key={navItem.title}
                  onSelect={() => {
                    runCommand(() => router.push(navItem.href as Route));
                  }}
                >
                  <File className='mr-2 h-4 w-4' />
                  {navItem.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading='Weiteres'>
            {homeConfig.sidebarNav
              .filter((navitem) => !navitem.external)
              .map((navItem) => (
                <CommandItem
                  key={navItem.title}
                  onSelect={() => {
                    runCommand(() => router.push(navItem.href as Route));
                  }}
                >
                  <File className='mr-2 h-4 w-4' />
                  {navItem.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <SunMedium className='mr-2 h-4 w-4' />
              Light
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='mr-2 h-4 w-4' />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className='mr-2 h-4 w-4' />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
