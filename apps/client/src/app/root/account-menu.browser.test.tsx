import { queryKeys } from '@kijk/api/query-keys';
import { create } from '@kijk/api/spaces/requests';
import { getMe } from '@kijk/api/users/requests';
import type { CurrentUser } from '@kijk/api/users/types';
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
  const family = { id: 'space', name: 'Family' };
  const holidayHome = { id: 'holiday', name: 'Holiday home' };
  client.setQueryData(queryKeys.users.me, currentUser([family]));
  vi.mocked(create).mockResolvedValue({ id: holidayHome.id });
  vi.mocked(getMe).mockResolvedValue(currentUser([family, holidayHome]));
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

interface SpaceFixture {
  id: string;
  name: string;
}

/** A ready current user who is admin of the given shared spaces. */
function currentUser(spaces: SpaceFixture[]): CurrentUser {
  return {
    status: 'Ready',
    user: {
      id: 'user',
      authId: 'test-user',
      email: 'user@example.test',
      analyticsConsent: 'Declined',
      analyticsConsentUpdatedAt: null,
      onboardingCompletedAt: null,
      sensitiveDataConsentAt: null,
      aiEnabled: false,
      name: 'Max',
      resources: [],
      useExternalProfile: false,
      spaces: spaces.map((space) => ({
        ...space,
        description: null,
        role: { id: 'admin', name: 'Admin', permissions: [] },
        isDefault: false,
        isPersonal: false,
      })),
    },
  };
}
