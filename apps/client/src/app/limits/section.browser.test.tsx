import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { queryKeys } from '@/shared/api/query-keys';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { worker } from '@/test/mocks/browser';

import { LimitsSection } from './section';

vi.mock('@/app/limits/form', () => ({ LimitForm: () => null }));

test.each([
  { role: 'Admin', permissions: [SpacePermissions.limits.plan], disabled: false },
  { role: 'Member', permissions: [SpacePermissions.limits.view], disabled: true },
  { role: 'Viewer', permissions: [SpacePermissions.limits.view], disabled: true },
])('$role gets limit actions matching its permissions', async ({ permissions, disabled }) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ isActive: true, role: { permissions } }] },
  });
  client.setQueryData(queryKeys.limits.list(), [
    {
      id: 'limit',
      name: 'Energy budget',
      period: 'Monthly',
      active: true,
      isExceeded: false,
      resource: { name: 'Electricity', unit: 'kWh' },
      actualValue: 0,
      limit: 100,
      utilizationPercentage: 0,
      remainingValue: 100,
    },
  ]);
  const screen = await render(
    <QueryClientProvider client={client}>
      <LimitsSection />
    </QueryClientProvider>,
  );
  for (const name of ['Add limit', 'Edit limit', 'Delete limit']) {
    const button = screen.getByRole('button', { name, exact: true });
    await expect.element(button).toHaveProperty('disabled', disabled);
  }
  await screen.unmount();
  client.clear();
});

test('deleting a limit requires confirmation and refreshes the list after a 204 response', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity }, mutations: { retry: false } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ isActive: true, role: { permissions: [SpacePermissions.limits.plan] } }] },
  });
  client.setQueryData(queryKeys.limits.list(), [
    {
      id: 'limit',
      name: 'Energy budget',
      period: 'Monthly',
      active: true,
      isExceeded: false,
      resource: { name: 'Electricity', unit: 'kWh' },
      actualValue: 0,
      limit: 100,
      utilizationPercentage: 0,
      remainingValue: 100,
    },
  ]);
  const deleted = vi.fn<() => void>();
  worker.use(
    http.delete('http://localhost:5000/api/limits/limit', () => {
      deleted();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const screen = await render(
    <QueryClientProvider client={client}>
      <LimitsSection />
    </QueryClientProvider>,
  );

  await screen.getByRole('button', { name: 'Delete limit', exact: true }).click();
  await expect.element(screen.getByRole('alertdialog')).toBeVisible();
  expect(deleted).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(deleted).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Delete limit', exact: true }).click();
  await screen.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect.element(screen.getByText('No consumption limits yet')).toBeVisible();
  expect(deleted).toHaveBeenCalledOnce();
  await screen.unmount();
  client.clear();
});
