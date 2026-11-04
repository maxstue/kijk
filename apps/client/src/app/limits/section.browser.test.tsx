import { queryKeys } from '@kijk/api/query-keys';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { LimitsSection } from './section';
import type { LimitsView } from './types';

vi.mock('@/app/limits/form', () => ({
  LimitForm: () => <input aria-label='Limit name' defaultValue='Energy budget' />,
}));

test.each([375, 1280])('switches views and preserves history dialogs at %i px', async (width) => {
  await page.viewport(width, 900);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ id: 'space', isDefault: true, role: { permissions: [SpacePermissions.limits.view] } }] },
  });
  client.setQueryData(queryKeys.limits.list('space'), [
    {
      id: 'limit',
      name: 'Energy budget',
      period: 'Month',
      active: true,
      isExceeded: true,
      resource: { name: 'Electricity', unit: 'kWh' },
      actualValue: 120,
      limit: 100,
      utilizationPercentage: 120,
      remainingValue: 0,
      history: [
        {
          periodStart: '2026-09-01T00:00:00Z',
          periodEnd: '2026-10-01T00:00:00Z',
          actualValue: 120,
          isExceeded: true,
          isComplete: false,
        },
        {
          periodStart: '2026-08-01T00:00:00Z',
          periodEnd: '2026-09-01T00:00:00Z',
          actualValue: 150,
          isExceeded: true,
          isComplete: true,
        },
        {
          periodStart: '2026-07-01T00:00:00Z',
          periodEnd: '2026-08-01T00:00:00Z',
          actualValue: 80,
          isExceeded: false,
          isComplete: true,
        },
      ],
    },
  ]);
  const screen = await render(
    <QueryClientProvider client={client}>
      <TestLimitsSection />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByRole('table', { name: 'Consumption limits' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: 'History', exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Limit reached in 1 of 2 completed recorded periods')).not.toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  await expect.element(screen.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
  await screen.getByRole('button', { name: 'Card view' }).click();
  await expect.element(screen.getByRole('list', { name: 'Consumption limits' })).toBeVisible();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  await expect.element(screen.getByRole('table', { name: 'Consumption limits' })).not.toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute('aria-pressed', 'true');
  await expect.element(screen.getByText('Limit reached in 1 of 2 completed recorded periods')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'History', exact: true }).click();
  const dialog = screen.getByRole('dialog');
  await expect.element(dialog.getByRole('heading', { name: 'Energy budget history' })).toBeVisible();
  await expect.element(dialog.getByText('150 / 100 kWh')).toBeVisible();
  await expect.element(dialog.getByText('80 / 100 kWh')).toBeVisible();
  await expect.element(dialog.getByText('120 / 100 kWh · In progress')).toBeVisible();
  await screen.rerender(
    <QueryClientProvider client={client}>
      <TestLimitsSection viewOverride='list' />
    </QueryClientProvider>,
  );
  await expect
    .element(screen.getByRole('dialog').getByRole('heading', { name: 'Energy budget history' }))
    .toBeVisible();
  await screen.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.element(screen.getByRole('table', { name: 'Consumption limits' })).toBeVisible();
  await screen.unmount();
  client.clear();
});

test.each([
  { role: 'Admin', permissions: [SpacePermissions.limits.plan], disabled: false },
  { role: 'Member', permissions: [SpacePermissions.limits.view], disabled: true },
  { role: 'Viewer', permissions: [SpacePermissions.limits.view], disabled: true },
])('$role gets limit actions matching its permissions', async ({ permissions, disabled }) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ id: 'space', isDefault: true, role: { permissions } }] },
  });
  client.setQueryData(queryKeys.limits.list('space'), [
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
      <TestLimitsSection />
    </QueryClientProvider>,
  );
  for (const name of ['Add limit', 'Edit limit', 'Delete limit']) {
    const button = screen.getByRole('button', { name, exact: true });
    await expect.element(button).toHaveProperty('disabled', disabled);
  }
  await screen.unmount();
  client.clear();
});

test('preserves an unsaved edit when the view changes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ id: 'space', role: { permissions: [SpacePermissions.limits.plan] } }] },
  });
  client.setQueryData(queryKeys.limits.list('space'), [
    {
      id: 'limit',
      name: 'Energy budget',
      period: 'Month',
      active: true,
      resource: { name: 'Electricity', unit: 'kWh' },
      actualValue: 0,
      limit: 100,
      utilizationPercentage: 0,
      remainingValue: 100,
      history: [],
    },
  ]);
  const screen = await render(
    <QueryClientProvider client={client}>
      <TestLimitsSection />
    </QueryClientProvider>,
  );
  await screen.getByRole('button', { name: 'Edit limit', exact: true }).click();
  await screen.getByRole('textbox', { name: 'Limit name' }).fill('Unsaved limit name');
  await screen.rerender(
    <QueryClientProvider client={client}>
      <TestLimitsSection viewOverride='cards' />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('textbox', { name: 'Limit name' })).toHaveValue('Unsaved limit name');
  await screen.unmount();
  client.clear();
});

test('deleting a limit requires confirmation and refreshes the list after a 204 response', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity }, mutations: { retry: false } } });
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ id: 'space', isDefault: true, role: { permissions: [SpacePermissions.limits.plan] } }] },
  });
  client.setQueryData(queryKeys.limits.list('space'), [
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
    http.delete('http://localhost:5000/api/spaces/space/limits/limit', () => {
      deleted();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const screen = await render(
    <QueryClientProvider client={client}>
      <TestLimitsSection />
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

interface TestLimitsSectionProps {
  viewOverride?: LimitsView;
}

function TestLimitsSection({ viewOverride }: TestLimitsSectionProps) {
  const [view, setView] = useState<LimitsView>('list');
  return <LimitsSection view={viewOverride ?? view} onViewChange={setView} />;
}
