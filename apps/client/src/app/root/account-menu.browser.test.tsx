import { queryKeys } from '@kijk/api/query-keys';
import { create } from '@kijk/api/spaces/requests';
import { getMe } from '@kijk/api/users/requests';
import { SidebarProvider } from '@kijk/ui/components/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { siteConfig } from '@/shared/config/site';
import { render } from '@/test/render-space';

import { AccountMenu } from './account-menu';

vi.mock('@/shared/runtime/auth', () => ({ useAppAuth: () => ({ signOut: async () => {} }) }));
vi.mock('./feedback-dialog', () => ({ FeedbackDialog: () => null }));
vi.mock('@kijk/api/spaces/requests', { spy: true });
vi.mock('@kijk/api/users/requests', { spy: true });

test('the support menu item is a named link to the support page', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: { name: 'Max', spaces: [{ id: 'space', name: 'Family', isPersonal: false }] },
  });
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <AccountMenu />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  try {
    await screen.getByRole('button', { name: 'Family' }).click();
    const support = screen.getByRole('menuitem', { name: 'Support', exact: true });
    await expect.element(support).toBeVisible();
    await expect.element(support).toHaveAttribute('href', siteConfig.links.support);
    await expect.element(support).toHaveAttribute('target', '_blank');
    await expect.element(support).toHaveAttribute('rel', 'noopener noreferrer');
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('creating a space sends its trimmed details and opens it', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const family = { id: 'space', name: 'Family', isPersonal: false };
  const holidayHome = { id: 'holiday', name: 'Holiday home', isPersonal: false };
  client.setQueryData(queryKeys.users.me, { status: 'Ready', user: { name: 'Max', spaces: [family] } });
  vi.mocked(create).mockResolvedValue({ id: holidayHome.id, name: holidayHome.name });
  vi.mocked(getMe).mockResolvedValue({
    status: 'Ready',
    user: { name: 'Max', spaces: [family, holidayHome] },
  } as never);
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <AccountMenu />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  try {
    await screen.getByRole('button', { name: 'Family' }).click();
    await screen.getByRole('menuitem', { name: 'Create space' }).click();
    await screen.getByRole('textbox', { name: 'Space name' }).fill('  Holiday home  ');
    await screen.getByRole('button', { name: 'Create space' }).click();

    await expect.poll(() => vi.mocked(create).mock.calls).toEqual([[{ description: null, name: 'Holiday home' }]]);
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    // The menu shows the new space once the current user has been refetched, and the app has switched to it.
    await screen.getByRole('button', { name: 'Holiday home' }).click();
    await expect
      .element(screen.getByRole('menuitem', { name: /Holiday home/ }).getByLabelText('Active space'))
      .toBeVisible();
  } finally {
    await screen.unmount();
    client.clear();
  }
});
