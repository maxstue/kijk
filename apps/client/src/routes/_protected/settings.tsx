import { Separator } from '@kijk/ui/components/separator';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { NotFound } from '@/shared/components/not-found';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';

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
    <div className='space-y-6 p-10 pb-16'>
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Settings</h2>
        <p className='text-muted-foreground'>Manage your profile, appearance and privacy settings.</p>
      </div>
      <Separator className='my-6' />
      <div className='max-w-3xl'>
        <Outlet />
      </div>
    </div>
  );
}
