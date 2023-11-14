import { Link, Outlet, useMatch } from 'react-router-dom';

import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { settingsNav } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <div className='space-y-6 p-10 pb-16'>
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
        <p className='text-muted-foreground'>Manage your account settings and set e-mail preferences.</p>
      </div>
      <Separator className='my-6' />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0'>
        <aside className=' lg:w-1/5'>
          <nav className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1')}>
            {settingsNav.map(({ to, label, icon }) => (
              <SettingsNavLink key={to} to={to} label={label} icon={icon} />
            ))}
          </nav>
        </aside>
        <div className='w-full flex-1 lg:pl-12'>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function SettingsNavLink({
  to,
  label,
  icon,
}: {
  to: (typeof settingsNav)[number]['to'];
  label: (typeof settingsNav)[number]['label'];
  icon: (typeof settingsNav)[number]['icon'];
}) {
  const match = useMatch(`home/settings/${to}`);
  const Icon = Icons[icon || 'arrowRight'];

  return (
    <Link
      key={label}
      to={to}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        match && 'bg-primary text-primary-foreground',
        'justify-start',
      )}
    >
      <Icon className='mr-2 h-4 w-4' />
      {label}
    </Link>
  );
}
