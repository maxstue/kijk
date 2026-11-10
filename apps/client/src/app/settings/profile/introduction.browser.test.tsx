import { queryKeys } from '@kijk/api/query-keys';
import * as usersApi from '@kijk/api/users/requests';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { expect, onTestFinished, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { IntroductionSettings } from './introduction';

vi.mock('@kijk/api/users/requests', { spy: true });
vi.mock('sonner', { spy: true });

async function setup() {
  vi.mocked(usersApi.resetGuide).mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const previous = {
    guideVersion: 1,
    guideCompletedVersion: 1,
    guideCompletedSteps: ['dashboard'],
    guideCompletedAt: '2026-11-10T09:00:00Z',
  };
  client.setQueryData(queryKeys.users.guide, previous);
  const screen = await render(
    <QueryClientProvider client={client}>
      <IntroductionSettings />
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return { screen, client, previous };
}

test('reset waits for the API, prevents duplicate clicks and updates the cached guide', async () => {
  const { screen, client } = await setup();
  const cleared = { guideVersion: 1, guideCompletedVersion: 0, guideCompletedSteps: [], guideCompletedAt: null };
  let release = () => {};
  vi.mocked(usersApi.resetGuide).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve(cleared);
      }),
  );
  await screen.getByRole('button', { name: 'Reset introduction' }).click();
  await expect.element(screen.getByRole('button', { name: 'Resetting…' })).toBeDisabled();
  expect(usersApi.resetGuide).toHaveBeenCalledOnce();
  release();
  await expect.poll(() => client.getQueryData(queryKeys.users.guide)).toEqual(cleared);
  await expect.element(screen.getByRole('button', { name: 'Reset introduction' })).toBeEnabled();
  expect(toast.success).toHaveBeenCalled();
});

test('failed resets keep progress and show a retryable error', async () => {
  const { screen, client, previous } = await setup();
  vi.mocked(usersApi.resetGuide).mockRejectedValueOnce(new Error('Unavailable'));
  await screen.getByRole('button', { name: 'Reset introduction' }).click();
  await expect.poll(() => vi.mocked(toast.error).mock.calls.length).toBe(1);
  expect(client.getQueryData(queryKeys.users.guide)).toEqual(previous);
  await expect.element(screen.getByRole('button', { name: 'Reset introduction' })).toBeEnabled();
});
