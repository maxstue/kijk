import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { NotFound } from '@/shared/components/not-found';

/** `/settings`: settings layout; redirects to the profile section. */
export const Route = createFileRoute('/_authenticated/_app/settings')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/settings') {
      throw redirect({ params: { section: 'profile' }, to: '/settings/$section' });
    }
  },
  component: SettingsPage,
  notFoundComponent: NotFound,
});

function SettingsPage() {
  return (
    <div className='w-full min-w-0 p-4 pb-16 sm:p-6 lg:p-10'>
      <Outlet />
    </div>
  );
}
