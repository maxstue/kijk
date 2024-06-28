import { PropsWithChildren, useCallback, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, HomeIcon, SettingsIcon, WalletIcon, ZapIcon } from 'lucide-react';

import { AppFooter } from '@/app/root/app-footer';
import { CommandMenu } from '@/app/root/command-menu';
import { UserNav } from '@/app/root/user-nav';
import { Icons } from '@/shared/components/icons';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { browserStorage } from '@/shared/lib/browser-storage';
import { siteConfig } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/helpers';

const SIDEBAR_KEY = 'sidebar';

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(browserStorage.getItem<boolean>(SIDEBAR_KEY) ?? false);
  const handleCollapse = useCallback(() => {
    return setIsCollapsed((s) => {
      browserStorage.setItem(SIDEBAR_KEY, !s);
      return !s;
    });
  }, []);

  return (
    <aside
      className={cn(
        'px-4 py-6 transition-all duration-300 ease-in-out',
        isCollapsed ? 'min-w-[4.125rem] max-w-[4.125rem]' : 'min-w-[250px] max-w-[250px]',
      )}
    >
      <div className='flex h-full flex-col justify-between'>
        <div className='flex flex-col'>
          <Link
            to='/home'
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'items-center justify-start gap-2 py-1 pl-[0.35rem] pr-0 hover:bg-transparent',
            )}
          >
            <div className='size-6'>
              <Icons.logo className='h-6' />
            </div>
            <div
              className={cn(
                'flex flex-1 items-center justify-between gap-2 overflow-hidden transition-all delay-100 duration-300 ease-in-out',
                isCollapsed ? 'w-0' : 'w-auto',
              )}
            >
              <div>
                <span
                  className={cn(
                    'text-sm font-medium transition-all delay-100 duration-300 ease-in-out',
                    isCollapsed ? 'hidden' : 'flex',
                  )}
                >
                  {siteConfig.name}
                </span>
              </div>
              <div className={cn('transition-all duration-300', isCollapsed ? 'hidden' : 'flex')}>
                <UserNav />
              </div>
            </div>
          </Link>

          <div className='flex justify-end'>
            <Button
              className='group flex size-5 translate-x-[27px] items-center justify-center border-2 bg-accent p-0 transition-all duration-300'
              onClick={handleCollapse}
              variant='ghost'
            >
              <ChevronLeft
                className={cn(
                  'w-4 text-primary/65 transition-all delay-150 duration-300 group-hover:text-accent-foreground',
                  isCollapsed ? 'rotate-180' : '',
                )}
              />
            </Button>
          </div>
          <div className={cn('my-1 w-full transition-all duration-300', isCollapsed ? 'flex' : 'hidden')}>
            <UserNav />
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex flex-col gap-2'>
              <CommandMenu isCollapsed={isCollapsed} />
            </div>

            <div className='flex flex-col gap-2'>
              <SidebarItem exact to='/home' isCollapsed={isCollapsed} leftSlot={<HomeIcon className='h-4' />}>
                <span className='text-sm font-medium'>Dashboard</span>
              </SidebarItem>
            </div>

            <div className='flex flex-col gap-2'>
              <SidebarItem
                to='/energy'
                className='pointer-events-none cursor-not-allowed opacity-50'
                isCollapsed={isCollapsed}
                leftSlot={<ZapIcon className='h-4' />}
              >
                <span className='text-sm font-medium'>Energy</span>
              </SidebarItem>
            </div>

            <div className='flex flex-col gap-2'>
              <SidebarItem to='/budget' isCollapsed={isCollapsed} leftSlot={<WalletIcon className='h-4' />}>
                <span className='text-sm font-medium'>Transactions</span>
              </SidebarItem>
            </div>
            <div className='flex flex-col gap-2'>
              <SidebarItem to='/settings' isCollapsed={isCollapsed} leftSlot={<SettingsIcon className='h-4' />}>
                <span className='text-sm font-medium'>Settings</span>
              </SidebarItem>
            </div>
          </div>
        </div>
        <AppFooter />
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  isCollapsed: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
  to: string;
  exact?: boolean;
  disabled?: boolean;
}

const SidebarItem = ({
  children,
  leftSlot,
  rightSlot,
  isCollapsed,
  to,
  disabled,
  exact = false,
  className = '',
}: PropsWithChildren<SidebarItemProps>) => {
  return (
    <Link
      key={to}
      to={to}
      disabled={disabled}
      preload={false}
      activeOptions={{ exact: exact }}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'group h-9 items-center justify-start gap-2 py-1 pl-[0.29rem] text-primary/65 hover:bg-primary/[0.05] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground',
        className,
      )}
    >
      <div className='size-4 shrink-0'>{leftSlot}</div>
      <div
        className={cn('flex flex-1 items-center justify-between gap-2 overflow-hidden', isCollapsed ? 'w-0' : 'w-auto')}
      >
        <div>{children}</div>
        <div>{rightSlot}</div>
      </div>
    </Link>
  );
};
