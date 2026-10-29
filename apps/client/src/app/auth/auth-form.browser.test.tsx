import { toast } from 'sonner';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { UserAuthForm } from './auth-form';

const { authenticateWithRedirect } = vi.hoisted(() => ({
  authenticateWithRedirect: vi.fn<(params: unknown) => Promise<void>>(),
}));

vi.mock('@clerk/tanstack-react-start/legacy', () => ({
  useSignIn: () => ({ isLoaded: true, signIn: { authenticateWithRedirect } }),
}));
vi.mock('sonner', { spy: true });

beforeEach(() => vi.clearAllMocks());

test('email submission normalizes the address and disables all sign-in actions until finished', async () => {
  const pending = Promise.withResolvers<unknown>();
  const onSubmit = vi.fn<(email: string, password: string) => Promise<unknown>>(() => pending.promise);
  const screen = await render(<UserAuthForm btnLabel='Login' redirectTo='/' onSubmit={onSubmit} />);
  try {
    await screen.getByRole('textbox', { name: 'Email' }).fill('MAX@example.test');
    await screen.getByLabelText('Password', { exact: true }).fill('example-password');
    await screen.getByRole('button', { name: 'Login', exact: true }).click();
    await expect.element(screen.getByRole('button', { name: 'Google' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'GitHub' })).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('max@example.test', 'example-password');

    pending.resolve(undefined);
    await expect.element(screen.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'Google' })).toBeEnabled();
  } finally {
    await screen.unmount();
  }
});

test('a social sign-in failure re-enables the form and reports the error', async () => {
  authenticateWithRedirect.mockRejectedValueOnce(new Error('Unavailable'));
  const screen = await render(<UserAuthForm btnLabel='Login' redirectTo='/' onSubmit={async () => {}} />);
  try {
    await screen.getByRole('button', { name: 'Google' }).click();
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Google sign-in failed. Please try again.'));
    await expect.element(screen.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'Google' })).toBeEnabled();
  } finally {
    await screen.unmount();
  }
});
