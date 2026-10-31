import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { Login } from './login';

const { create, setActive } = vi.hoisted(() => ({
  create: vi.fn<(params: unknown) => Promise<unknown>>(),
  setActive: vi.fn<(params: unknown) => Promise<void>>(),
}));

vi.mock('@clerk/tanstack-react-start/legacy', () => ({
  useSignIn: () => ({ isLoaded: true, signIn: { create }, setActive }),
}));

beforeEach(() => vi.clearAllMocks());

async function renderLogin() {
  const root = createRootRoute();
  const route = createRoute({ getParentRoute: () => root, path: '/auth', component: LoginPage });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/auth'] }),
  });
  const screen = await render(<RouterProvider router={router} />);
  await screen.getByRole('textbox', { name: 'Email' }).fill('user@example.test');
  await screen.getByLabelText('Password', { exact: true }).fill('example-password');
  return { router, screen };
}

function LoginPage() {
  return <Login goto={() => {}} redirectTo='/' />;
}

test('keeps credential errors visible and stays on auth', async () => {
  create.mockRejectedValueOnce({ errors: [{ longMessage: 'The email address or password is incorrect.' }] });
  const { router, screen } = await renderLogin();
  try {
    await screen.getByRole('button', { name: 'Login', exact: true }).click();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('The email address or password is incorrect.');
    expect(setActive).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/auth');
    await expect.element(screen.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
  } finally {
    await screen.unmount();
  }
});

test('explains incomplete verification without dumping the Clerk session object', async () => {
  create.mockResolvedValueOnce({ status: 'needs_second_factor', internalValue: 'must-not-be-displayed' });
  const { router, screen } = await renderLogin();
  try {
    await screen.getByRole('button', { name: 'Login', exact: true }).click();
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent(
        'Your sign-in requires additional verification and could not be completed here. Try another sign-in method or contact support.',
      );
    expect(setActive).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/auth');
  } finally {
    await screen.unmount();
  }
});
