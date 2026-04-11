import { cn } from '@kijk/core/utils/style';
import { Button, buttonVariants } from '@kijk/ui/components/button';
import { Icons } from '@kijk/ui/components/icons';
import { Separator } from '@kijk/ui/components/separator';
import { Outlet, createFileRoute, createLink, redirect } from '@tanstack/react-router';

import { NotFound } from '@/shared/components/not-found';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { settingsNav } from '@/shared/lib/constants';

export const Route = createFileRoute('/_protected/settings')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/settings') {
      throw redirect({ params: { section: 'profile' }, to: '/settings/$section' });
    }
  },
  component: SettingsPage,
  notFoundComponent: NotFound,
});

function SettingsPage() {
  useSetSiteHeader('Settings');
  return (
    <>
      <div className='space-y-6 p-10 pb-16'>
        <div className='space-y-0.5'>
          <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
          <p className='text-muted-foreground'>Manage your account settings and set e-mail preferences.</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0'>
          <aside className='lg:w-1/5'>
            <nav className={cn('flex space-x-2 lg:flex-col lg:space-y-1 lg:space-x-0')}>
              {settingsNav.map(({ to, label, icon }) => (
                <SettingsNavLink key={to} icon={icon} label={label} to={to} />
              ))}
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

const LinkButton = createLink(Button);

function SettingsNavLink({
  to,
  label,
  icon,
}: {
  to: (typeof settingsNav)[number]['to'];
  label: (typeof settingsNav)[number]['label'];
  icon: (typeof settingsNav)[number]['icon'];
}) {
  const Icon = Icons[icon];

  return (
    <LinkButton
      key={label}
      params={{ section: to }}
      to='/settings/$section'
      variant='ghost'
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'data-[status=active]:text-primary-foreground data-[status=active]:bg-primary data-[status=active]:hover:bg-muted data-[status=active]:hover:text-foreground justify-start',
      )}
    >
      <Icon className='mr-2 h-4 w-4' />
      {label}
    </LinkButton>
  );
}
