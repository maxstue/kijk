import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { DeleteAccount } from './delete-account';

const { navigate, requestAccountDeletion, signOut } = vi.hoisted(() => ({
  navigate: vi.fn<(options: unknown) => Promise<void>>(() => Promise.resolve()),
  requestAccountDeletion: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  signOut: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('@clerk/react', () => ({ useAuth: () => ({ signOut }) }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/shared/api/users/requests', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api/users/requests')>()),
  requestAccountDeletion,
}));

test('deleting the account needs the typed confirmation and signs out', async () => {
  const client = new QueryClient();
  const screen = await render(
    <QueryClientProvider client={client}>
      <DeleteAccount />
    </QueryClientProvider>,
  );

  await screen.getByRole('button', { name: 'Delete my account' }).click();
  const confirm = screen.getByRole('button', { name: 'Delete everything' });
  await expect.element(confirm).toBeDisabled();
  await screen.getByLabelText(/Type DELETE to confirm/).fill('delete');
  await expect.element(confirm).toBeDisabled();
  await screen.getByLabelText(/Type DELETE to confirm/).fill('DELETE');
  await confirm.click();

  await vi.waitFor(() => expect(signOut).toHaveBeenCalled());
  expect(requestAccountDeletion).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith({ replace: true, to: '/' });
  await screen.unmount();
});
