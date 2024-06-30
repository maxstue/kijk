import { Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { File, Laptop, Moon, SunMedium } from 'lucide-react';

import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { CategoryCreateForm } from '@/app/settings/categories/categories-create-form';
import { ThemeQuickCustomizer } from '@/shared/components/theme-quick-customizer';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { settingsNav } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/helpers';
import { useThemeStoreActions } from '@/shared/stores/theme-store';
import { months } from '@/shared/types/app';
import type { DialogProps } from '@radix-ui/react-dialog';

interface Props extends DialogProps {
  isCollapsed?: boolean;
}

export function CommandMenu({ ...props }: Props) {
  const navigate = useNavigate({ from: '/' });
  const [open, setOpen] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'transaction'>();
  const { setMode } = useThemeStoreActions();

  const handleCloseSheet = useCallback(() => {
    setShowSheet(false);
    setSheetType(undefined);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
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
          'group relative h-9 w-full justify-start text-sm text-muted-foreground',
          props.isCollapsed ? 'p-1' : 'sm:pr-12',
        )}
        onClick={handleOpen(true)}
      >
        {props.isCollapsed ? null : <span className='inline-flex'>Search...</span>}

        <kbd
          className={cn(
            'pointer-events-none absolute top-2 hidden h-5 select-none items-center gap-1 rounded-sm px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex',
            props.isCollapsed ? 'right-0' : 'right-1.5 bg-muted group-hover:bg-background',
          )}
        >
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput className='bg-background' placeholder='Type a command or search...' />
          <CommandList className='bg-background'>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading='Links'>
              <CommandItem key='Home' onSelect={runCommand(() => navigate({ to: '/' }))}>
                <File className='mr-2 h-4 w-4' />
                Home
              </CommandItem>

              <CommandItem
                key='budget'
                onSelect={runCommand(() =>
                  navigate({
                    to: '/budget',
                    search: (prev) => ({
                      ...prev,
                      month: months[new Date().getMonth()],
                      year: new Date().getFullYear(),
                    }),
                  }),
                )}
              >
                <File className='mr-2 h-4 w-4' />
                Budget
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading='Actions'>
              <CommandItem
                key='create-transaction'
                onSelect={runCommand(() => {
                  setSheetType('transaction');
                  setShowSheet(true);
                })}
              >
                <SheetTrigger>Create transaction</SheetTrigger>
              </CommandItem>
              <CommandItem
                key='create-category'
                onSelect={runCommand(() => {
                  setSheetType('category');
                  setShowSheet(true);
                })}
              >
                <SheetTrigger>Create category</SheetTrigger>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />

            <CommandGroup heading='Settings'>
              {settingsNav.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={runCommand(() => navigate({ to: '/settings/$section', params: { section: item.to } }))}
                >
                  <File className='mr-2 h-4 w-4' />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading='Theme'>
              <CommandItem value='theme-light' onSelect={runCommand(() => setMode('light'))}>
                <SunMedium className='mr-2 h-4 w-4' />
                Light
              </CommandItem>
              <CommandItem value='theme-dark' onSelect={runCommand(() => setMode('dark'))}>
                <Moon className='mr-2 h-4 w-4' />
                Dark
              </CommandItem>
              <CommandItem value='theme-system' onSelect={runCommand(() => setMode('system'))}>
                <Laptop className='mr-2 h-4 w-4' />
                System
              </CommandItem>
              <CommandItem value='theme-quick'>
                <ThemeQuickCustomizer onSelect={handleOpen(false)} />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
        <SheetContent className='space-y-8'>
          {showSheet && (
            <Suspense>
              {sheetType === 'transaction' && <TransactionSheet onClose={handleCloseSheet} />}
              {sheetType === 'category' && <CategorySheet onClose={handleCloseSheet} />}
            </Suspense>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

interface EdProps {
  onClose: () => void;
}

function TransactionSheet({ onClose }: EdProps) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Create Transaction</SheetTitle>
        <SheetDescription>Create a new transaction.</SheetDescription>
      </SheetHeader>
      <Suspense>
        <TransactionCreateForm fromCmd onClose={onClose} />
      </Suspense>
    </>
  );
}

function CategorySheet({ onClose }: EdProps) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Create Category</SheetTitle>
        <SheetDescription>Create a new category.</SheetDescription>
      </SheetHeader>
      <Suspense>
        <CategoryCreateForm onClose={onClose} />
      </Suspense>
    </>
  );
}
