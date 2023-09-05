import { Link, Outlet } from '@tanstack/react-router';

import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// TODO make subpages with dynamic param instead of hardcoding them
export function SettingsPage() {
  return (
    <>
      <div className='space-y-6 p-10 pb-16'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
          <p className='text-muted-foreground'>Manage your account settings and set e-mail preferences.</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0'>
          <aside className=' lg:w-1/5'>
            <nav className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1')}>
              <Link
                to={'/settings'}
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-accent-foreground text-white' }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
              >
                <Icons.user className='mr-2 h-4 w-4' />
                Profile
              </Link>
              <Link
                to={'/settings/account'}
                activeProps={{ className: 'bg-accent-foreground text-white' }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
              >
                <Icons.settings className='mr-2 h-4 w-4' />
                Account
              </Link>
              <Link
                to={'/settings/appearance'}
                activeProps={{ className: 'bg-accent-foreground text-white' }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
              >
                <Icons.monitor className='mr-2 h-4 w-4' />
                Appearance
              </Link>
              <Link
                to={'/settings/notifications'}
                activeProps={{ className: 'bg-accent-foreground text-white' }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
              >
                <Icons.bellRing className='mr-2 h-4 w-4' />
                Notifications
              </Link>
              <Link
                to={'/settings/categories'}
                activeProps={{ className: 'bg-accent-foreground text-white' }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start')}
              >
                <Icons.category className='mr-2 h-4 w-4' />
                Categories
              </Link>
            </nav>
          </aside>
          <div className='w-full flex-1 lg:pl-12'>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
