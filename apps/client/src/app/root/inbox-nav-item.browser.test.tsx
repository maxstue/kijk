import { queryKeys } from '@kijk/api/query-keys';
import type { ReceivedInvitation } from '@kijk/api/users/types';
import { SidebarMenu, SidebarProvider } from '@kijk/ui/components/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { expect, onTestFinished, test } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { InboxNavItem } from './inbox-nav-item';

interface Props extends PropsWithChildren {}

async function renderItem(invitations: Array<Pick<ReceivedInvitation, 'id'>>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.invitations, invitations);
  function Wrapper({ children }: Props) {
    return (
      <QueryClientProvider client={client}>
        <SidebarProvider>
          <SidebarMenu>{children}</SidebarMenu>
        </SidebarProvider>
      </QueryClientProvider>
    );
  }
  const screen = await render(<InboxNavItem />, { wrapper: Wrapper });
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return screen;
}

test('shows the number of pending invitations', async () => {
  const screen = await renderItem([{ id: 'first' }, { id: 'second' }]);

  await expect.element(screen.getByRole('link', { name: 'Inbox, 2 pending invitations' })).toBeVisible();
  await expect.element(screen.getByText('2', { exact: true })).toBeVisible();
});

test('shows no badge without invitations', async () => {
  const screen = await renderItem([]);

  await expect.element(screen.getByRole('link', { name: 'Inbox' })).toBeVisible();
  expect(screen.container.textContent).not.toMatch(/\d/);
});
