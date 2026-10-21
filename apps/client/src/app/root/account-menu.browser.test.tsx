import { queryKeys } from '@kijk/api/query-keys';
import { SidebarProvider } from '@kijk/ui/components/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';

import { siteConfig } from '@/shared/config/site';
import { render } from '@/test/render-space';

import { AccountMenu } from './account-menu';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ signOut: async () => {} }) }));
vi.mock('./feedback-dialog', () => ({ FeedbackDialog: () => null }));

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
