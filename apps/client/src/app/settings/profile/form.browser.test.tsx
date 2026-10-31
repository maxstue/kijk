import { queryKeys } from '@kijk/api/query-keys';
import * as usersApi from '@kijk/api/users/requests';
import type { CurrentUser } from '@kijk/api/users/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, expect, onTestFinished, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { AppAuthContext } from '@/shared/runtime/auth';

import { ProfileForm } from './form';

vi.mock('@kijk/api/users/requests', { spy: true });
vi.mock('sonner', { spy: true });

beforeEach(() => {
  vi.mocked(usersApi.getMe).mockReset();
  vi.mocked(usersApi.update).mockReset();
  vi.mocked(usersApi.setDefaultSpace).mockReset();
  vi.mocked(toast.error).mockClear();
});

async function renderProfile() {
  let account: CurrentUser = {
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
      spaces: [
        {
          id: 'personal',
          name: 'Personal',
          description: null,
          role: { id: 'admin', name: 'Admin', permissions: [] },
          isDefault: true,
          isPersonal: true,
        },
        {
          id: 'shared',
          name: 'Family',
          description: null,
          role: { id: 'admin', name: 'Admin', permissions: [] },
          isDefault: false,
          isPersonal: false,
        },
      ],
    },
  };
  vi.mocked(usersApi.getMe).mockImplementation(async () => account);
  vi.mocked(usersApi.update).mockImplementation(async (data) => {
    account = {
      ...account,
      user: {
        ...account.user!,
        name: data.userName ?? account.user!.name,
        useExternalProfile: data.useExternalProfile ?? account.user!.useExternalProfile,
      },
    };
    return { ...account.user!, useDefaultResources: data.useDefaultResources ?? false };
  });
  vi.mocked(usersApi.setDefaultSpace).mockImplementation(async (spaceId) => {
    account = {
      ...account,
      user: {
        ...account.user!,
        spaces: account.user!.spaces!.map((space) => ({ ...space, isDefault: space.id === spaceId })),
      },
    };
    return account;
  });
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(queryKeys.users.me, account);
  const screen = await render(
    <QueryClientProvider client={client}>
      <AppAuthContext value={{ isLoaded: true, isSignedIn: true, signOut: async () => {} }}>
        <ProfileForm />
      </AppAuthContext>
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return screen;
}

test('keeps a default-space selection local until Update profile is clicked', async () => {
  const screen = await renderProfile();
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeDisabled();
  await screen.getByRole('combobox', { name: 'Default space' }).click();
  await screen.getByRole('option', { name: 'Family', exact: true }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Family');
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeEnabled();
  expect(usersApi.setDefaultSpace).not.toHaveBeenCalled();
  expect(usersApi.update).not.toHaveBeenCalled();

  await screen.getByRole('button', { name: 'Update profile' }).click();
  await vi.waitFor(() => expect(usersApi.setDefaultSpace).toHaveBeenCalledExactlyOnceWith('shared'));
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeDisabled();
  expect(usersApi.update).not.toHaveBeenCalled();
});

test('saves profile changes and a cleared default together through the shared button', async () => {
  const screen = await renderProfile();
  await screen.getByRole('textbox', { name: 'Username' }).fill('Updated Max');
  await screen.getByRole('checkbox', { name: 'Use sign-in profile' }).click();
  await screen.getByRole('combobox', { name: 'Default space' }).click();
  await screen.getByRole('option', { name: 'None — use the last visited space' }).click();
  expect(usersApi.update).not.toHaveBeenCalled();
  expect(usersApi.setDefaultSpace).not.toHaveBeenCalled();

  await screen.getByRole('button', { name: 'Update profile' }).click();
  await vi.waitFor(() => expect(usersApi.setDefaultSpace).toHaveBeenCalledExactlyOnceWith(null));
  expect(usersApi.update).toHaveBeenCalledOnce();
  expect(vi.mocked(usersApi.update).mock.calls[0][0]).toEqual({
    userName: 'Updated Max',
    useExternalProfile: true,
    useDefaultResources: false,
  });
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('None — use the last visited space');
  await expect.element(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('Updated Max');
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeDisabled();
});

test('retains remaining changes after a partial save so the same button can retry', async () => {
  const screen = await renderProfile();
  vi.mocked(usersApi.setDefaultSpace).mockRejectedValueOnce(new Error('Service temporarily unavailable'));
  await screen.getByRole('textbox', { name: 'Username' }).fill('Updated Max');
  await screen.getByRole('combobox', { name: 'Default space' }).click();
  await screen.getByRole('option', { name: 'Family', exact: true }).click();
  await screen.getByRole('button', { name: 'Update profile' }).click();
  await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(usersApi.update).toHaveBeenCalledOnce();
  await expect.element(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('Updated Max');
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Family');
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeEnabled();
  await screen.getByRole('button', { name: 'Update profile' }).click();
  await expect.element(screen.getByRole('button', { name: 'Update profile' })).toBeDisabled();
  expect(usersApi.setDefaultSpace).toHaveBeenCalledTimes(2);
});
