import { useCallback, useEffect, useState } from 'react';
import { DialogProps } from '@radix-ui/react-alert-dialog';
import { useNavigate } from '@tanstack/react-router';
import { File, Laptop, Moon, SunMedium } from 'lucide-react';

import { TransactionCreateForm } from '@/app/budget/transaction-create-form';
import { CategoryCreateForm } from '@/app/settings/categories/categories-create-form';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/use-theme';
import { settingsNav } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CommandMenu({ ...props }: DialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'transaction'>();
  const { setTheme } = useTheme();

  const handleClose = () => {
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
        className={cn(
          'relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64',
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className='hidden lg:inline-flex'>Search app...</span>
        <span className='inline-flex lg:hidden'>Search...</span>
        <kbd className='pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder='Type a command or search...' />
          <CommandList>
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

              <CommandItem key='budget' onSelect={() => runCommand(() => navigate({ to: '/budget' }))}>
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
                  // TODO fix this
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  onSelect={() => runCommand(() => navigate({ to: `/settings/${item.to}` }))}
                >
                  <File className='mr-2 h-4 w-4' />
                  {item.label}
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
        <SheetContent className='space-y-8'>
          {showSheet && (
            <>
              {sheetType === 'transaction' && <TransactionSheet onClose={handleClose} />}
              {sheetType === 'category' && <CategorySheet onClose={handleClose} />}
            </>
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
      <TransactionCreateForm fromCmd onClose={onClose} />
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
      <CategoryCreateForm onClose={onClose} />
    </>
  );
}
