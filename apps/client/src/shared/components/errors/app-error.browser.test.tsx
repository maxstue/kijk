import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { App } from '@/app';

import { AppError } from './app-error';

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn<(error: unknown) => void>(),
}));

vi.mock('@/shared/components/theme-mode-switcher', () => ({ ThemeModeSwitcher: () => null }));
vi.mock('@/shared/lib/error-tracking', () => ({ ErrorService: { captureException } }));

test.each([
  {
    name: 'circular reference',
    createError: () => {
      const error: { self?: unknown } = {};
      error.self = error;
      return error;
    },
  },
  { name: 'BigInt', createError: () => 1n },
  {
    name: 'throwing serializer',
    createError: () => ({
      toJSON() {
        throw new Error('Serialization failed');
      },
    }),
  },
])('keeps the error fallback usable for a $name', async ({ createError }) => {
  const retry = vi.fn<() => void>();
  const screen = await render(<AppError error={createError()} onRetry={retry} />);
  try {
    await screen.getByRole('button', { name: 'Show more advanced information:' }).click();
    await expect.element(screen.getByText('Error details cannot be displayed.', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Try again', exact: true }).click();
    expect(retry).toHaveBeenCalledOnce();
  } finally {
    await screen.unmount();
  }
});

test('reports a caught render error once and retries the failed content', async () => {
  const queryClient = new QueryClient();
  const error = new Error('The chart failed to render');
  let shouldFail = true;
  function Content() {
    if (shouldFail) {
      throw error;
    }
    return <p>Chart recovered</p>;
  }

  const screen = await render(
    <App queryClient={queryClient}>
      <Content />
    </App>,
  );
  try {
    await expect.element(screen.getByText(error.message, { exact: true })).toBeVisible();
    expect(captureException).toHaveBeenCalledExactlyOnceWith(error);
    await screen.getByRole('button', { name: 'Show more advanced information:' }).click();
    await screen.getByRole('button', { name: 'Hide more advanced information:' }).click();
    expect(captureException).toHaveBeenCalledTimes(1);

    shouldFail = false;
    await screen.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect.element(screen.getByText('Chart recovered', { exact: true })).toBeVisible();
    expect(captureException).toHaveBeenCalledTimes(1);
  } finally {
    await screen.unmount();
    queryClient.clear();
  }
});

test('Try again resets a failed suspense query so its request can recover', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const error = new Error('Statistics could not be loaded');
  let attempts = 0;
  const loadStatistics = vi.fn<() => Promise<string>>(async () => {
    attempts += 1;
    if (attempts === 1) {
      throw error;
    }
    return 'Statistics loaded';
  });
  function Statistics() {
    const { data } = useSuspenseQuery({
      queryKey: ['statistics-regression'],
      queryFn: loadStatistics,
    });
    return <p>{data}</p>;
  }

  const screen = await render(
    <App queryClient={queryClient}>
      <Suspense fallback={<p>Loading statistics</p>}>
        <Statistics />
      </Suspense>
    </App>,
  );
  try {
    await expect.element(screen.getByText(error.message, { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect.element(screen.getByText('Statistics loaded', { exact: true })).toBeVisible();
    expect(loadStatistics).toHaveBeenCalledTimes(2);
    expect(captureException).toHaveBeenCalledExactlyOnceWith(error);
  } finally {
    await screen.unmount();
    queryClient.clear();
  }
});
