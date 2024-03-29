import { Suspense, useCallback, useEffect, useState } from 'react';
import { DialogProps } from '@radix-ui/react-alert-dialog';
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
import { cn } from '@/shared/lib/utils';
import { useThemeStoreActions } from '@/shared/stores/theme-store';

export function CommandMenu({ ...props }: DialogProps) {
  const navigate = useNavigate({ from: '/' });
  const [open, setOpen] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'transaction'>();
  const { setMode } = useThemeStoreActions();

  const handleCloseSheet = () => {
    setShowSheet(false);
    setSheetType(undefined);
  };

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

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant='outline'
        className={cn('group relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64')}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className='hidden lg:inline-flex'>Search app...</span>
        <span className='inline-flex lg:hidden'>Search...</span>
        <kbd className='pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded-sm bg-muted  px-1.5 font-mono text-[10px] font-medium opacity-100 group-hover:bg-background sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput className='bg-background' placeholder='Type a command or search...' />
          <CommandList className='bg-background'>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading='Links'>
              <CommandItem
                key='Home'
                onSelect={() => {
                  runCommand(() => navigate({ to: '/' }));
                }}
              >
                <File className='mr-2 h-4 w-4' />
                Home
              </CommandItem>

              <CommandItem key='budget' onSelect={() => runCommand(() => navigate({ to: '/home/budget' }))}>
                <File className='mr-2 h-4 w-4' />
                Budget
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading='Actions'>
              <CommandItem
                key='create-transaction'
                onSelect={() =>
                  runCommand(() => {
                    setSheetType('transaction');
                    setShowSheet(true);
                  })
                }
              >
                <SheetTrigger>Create transaction</SheetTrigger>
              </CommandItem>
              <CommandItem
                key='create-category'
                onSelect={() =>
                  runCommand(() => {
                    setSheetType('category');
                    setShowSheet(true);
                  })
                }
              >
                <SheetTrigger>Create category</SheetTrigger>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />

            <CommandGroup heading='Settings'>
              {settingsNav.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() =>
                    runCommand(() => navigate({ to: '/home/settings/$section', params: { section: item.to } }))
                  }
                >
                  <File className='mr-2 h-4 w-4' />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading='Theme'>
              <CommandItem value='theme-light' onSelect={() => runCommand(() => setMode('light'))}>
                <SunMedium className='mr-2 h-4 w-4' />
                Light
              </CommandItem>
              <CommandItem value='theme-dark' onSelect={() => runCommand(() => setMode('dark'))}>
                <Moon className='mr-2 h-4 w-4' />
                Dark
              </CommandItem>
              <CommandItem value='theme-system' onSelect={() => runCommand(() => setMode('system'))}>
                <Laptop className='mr-2 h-4 w-4' />
                System
              </CommandItem>
              <CommandItem value='theme-quick'>
                <ThemeQuickCustomizer onSelect={() => setOpen(false)} />
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
