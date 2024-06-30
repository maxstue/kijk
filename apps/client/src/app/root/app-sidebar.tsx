import { PropsWithChildren } from 'react';
import { Link } from '@tanstack/react-router';
import { CircleHelpIcon, HomeIcon, SettingsIcon, WalletIcon, ZapIcon } from 'lucide-react';

import { CommandMenu } from '@/app/root/command-menu';
import { UserNav } from '@/app/root/user-nav';
import { Icons } from '@/shared/components/icons';
import { buttonVariants } from '@/shared/components/ui/button';
import { siteConfig } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/helpers';

export const AppSidebar = () => {
  return (
    <aside className='flex h-full flex-col justify-between px-4 py-6'>
      <div className='flex flex-col'>
        <div className='flex w-full items-center justify-between py-1'>
          <Link
            to='/home'
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'items-center justify-start gap-1 pl-1 hover:bg-transparent',
            )}
          >
            <Icons.logo className='size-6' />
            <div className='flex text-sm font-medium'>{siteConfig.name}</div>
          </Link>
          <UserNav />
        </div>

        <div className='flex flex-col gap-2'>
          <div className='my-6'>
            <CommandMenu />
          </div>

          <SidebarItem exact to='/home' leftSlot={<HomeIcon className='h-4' />}>
            <span className='text-sm font-medium'>Dashboard</span>
          </SidebarItem>

          <SidebarItem to='/energy' leftSlot={<ZapIcon className='h-4' />}>
            <span className='text-sm font-medium'>Energy</span>
          </SidebarItem>

          <SidebarItem to='/budget' leftSlot={<WalletIcon className='h-4' />}>
            <span className='text-sm font-medium'>Transactions</span>
          </SidebarItem>

          <SidebarItem to='/settings' leftSlot={<SettingsIcon className='h-4' />}>
            <span className='text-sm font-medium'>Settings</span>
          </SidebarItem>
        </div>
      </div>
      {/* Footer */}
      <div className='flex flex-col gap-2'>
        <ExSidebarItem to='https://github.com/maxstue/kijk/discussions' leftSlot={<CircleHelpIcon className='h-4' />}>
          <span className='text-sm font-medium'>Support</span>
        </ExSidebarItem>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  leftSlot?: React.ReactNode;
  className?: string;
  to: string;
  exact?: boolean;
}

const SidebarItem = ({
  children,
  leftSlot,
  to,
  exact = false,
  className = '',
}: PropsWithChildren<SidebarItemProps>) => {
  return (
    <Link
      key={to}
      to={to}
      preload={false}
      activeOptions={{ exact: exact, includeSearch: false }}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'group h-8 items-center justify-start gap-2 py-0.5 pl-1 text-primary/65 hover:bg-primary/[0.05] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground',
        className,
      )}
    >
      <div className='size-4 shrink-0'>{leftSlot}</div>
      <div className='flex w-auto flex-1 items-center justify-between gap-2 overflow-hidden'>
        <div>{children}</div>
      </div>
    </Link>
  );
};

interface ExSidebarItemProps {
  leftSlot?: React.ReactNode;
  className?: string;
  to: string;
}

const ExSidebarItem = ({ children, leftSlot, to, className = '' }: PropsWithChildren<ExSidebarItemProps>) => {
  return (
    <a
      key={to}
      href={to}
      rel='noopener noreferrer'
      target='_blank'
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'group h-8 items-center justify-start gap-2 py-0.5 pl-1 text-primary/65 hover:bg-primary/[0.05] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground',
        className,
      )}
    >
      <div className='size-4 shrink-0'>{leftSlot}</div>
      <div className='flex w-auto flex-1 items-center justify-between gap-2 overflow-hidden'>
        <div>{children}</div>
      </div>
    </a>
  );
};
