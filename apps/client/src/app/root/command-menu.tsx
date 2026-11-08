import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@kijk/ui/components/command';
import { DialogDescription, DialogTitle } from '@kijk/ui/components/dialog';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useNavGroups } from '@/app/root/use-nav-groups';
import { useNavigationSpaceId } from '@/shared/hooks/use-active-space';
import { settingsNav } from '@/shared/navigation/settings';

import { CommandTrigger } from './command-trigger';
import { ThemeCommands } from './theme-commands';

interface Props {
  isCollapsed?: boolean;
}

/** Command palette (⌘K) to navigate the app. */
export function CommandMenu({ ...props }: Props) {
  const spaceId = useNavigationSpaceId();
  const navGroups = useNavGroups();
  const navigate = useNavigate({ from: '/' });
  const [open, setOpen] = useState(false);

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

  const runCommand = (command: () => unknown) => () => {
    setOpen(false);
    command();
  };

  const handleOpen = (value: boolean) => () => {
    setOpen(value);
  };

  return (
    <>
      <CommandTrigger isCollapsed={props.isCollapsed} onOpen={handleOpen(true)} />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <DialogTitle aria-hidden className='hidden'>
            Command Menu
          </DialogTitle>
          <DialogDescription aria-hidden className='hidden'>
            Command menu
          </DialogDescription>
          <CommandInput placeholder='Search...' />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {navGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <CommandItem
                      key={item.url}
                      keywords={[group.label]}
                      value={item.title}
                      onSelect={runCommand(() => navigate({ params: { spaceId }, to: item.url }))}
                    >
                      <item.icon />
                      {item.title}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <CommandGroup heading='Settings'>
              {settingsNav.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.label}
                    onSelect={runCommand(() => navigate({ params: { section: item.to }, to: '/settings/$section' }))}
                  >
                    <Icon />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <ThemeCommands runCommand={runCommand} />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
