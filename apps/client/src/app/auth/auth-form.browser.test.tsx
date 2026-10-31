import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { UserAuthForm } from './auth-form';

const { authenticateWithRedirect } = vi.hoisted(() => ({
  authenticateWithRedirect: vi.fn<(params: unknown) => Promise<void>>(),
}));

vi.mock('@clerk/tanstack-react-start/legacy', () => ({
  useSignIn: () => ({ isLoaded: true, signIn: { authenticateWithRedirect } }),
}));

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
    expect(authenticateWithRedirect).toHaveBeenCalledExactlyOnceWith({
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/auth?from=%2F',
      strategy: 'oauth_google',
    });
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Google sign-in could not be started. Please try again or choose another sign-in method.');
    await expect.element(screen.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'Google' })).toBeEnabled();
  } finally {
    await screen.unmount();
  }
});

test('social sign-in returns to auth so the Kijk account is checked before navigation', async () => {
  authenticateWithRedirect.mockResolvedValueOnce(undefined);
  const screen = await render(
    <UserAuthForm btnLabel='Login' redirectTo='/space/consumptions?year=2026' onSubmit={async () => {}} />,
  );
  try {
    await screen.getByRole('button', { name: 'Google' }).click();
    expect(authenticateWithRedirect).toHaveBeenCalledExactlyOnceWith({
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/auth?from=%2Fspace%2Fconsumptions%3Fyear%3D2026',
      strategy: 'oauth_google',
    });
  } finally {
    await screen.unmount();
  }
});
