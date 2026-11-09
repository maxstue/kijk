import { queryKeys } from '@kijk/api/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

import { Route as appRoute } from '@/routes/_authenticated/_app/route';
import { worker } from '@/test/mocks/browser';
import { renderRoute } from '@/test/render-route';

const resource = {
  id: 'electricity',
  name: 'Electricity',
  color: '#123456',
  icon: 'zap',
  unitId: 'unit',
  unit: 'kWh',
  unitName: 'Kilowatt-hours',
  quantityKey: 'Energy',
  creatorType: 'System',
};

function seed(client: QueryClient, resources = [resource]) {
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: {
      id: 'user',
      analyticsConsent: 'Declined',
      spaces: ['space', 'other'].map((id) => ({
        id,
        name: id,
        role: {
          permissions: [
            'consumptions:view',
            'consumptions:record',
            'resources:view',
            'resources:configure',
            'limits:plan',
            'limits:view',
          ],
        },
      })),
    },
  });
  client.setQueryData(queryKeys.users.features, { finances: false });
  client.setQueryData(queryKeys.users.guide, {
    guideHidden: false,
    guideVersion: 1,
    guideCompletedVersion: 0,
    guideCompletedSteps: [],
    guideFirstConsumptionAt: null,
  });
  client.setQueryData(queryKeys.resources.list('space'), resources);
  client.setQueryData(queryKeys.consumptions.years('space'), { years: [] });
  client.setQueryData(queryKeys.limits.list('space'), []);
  client.setQueryData(queryKeys.dashboard.consumptions('space', 2026), []);
  client.setQueryData(queryKeys.dashboard.limits('space', 2026, 11), []);
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/consumptions', () => HttpResponse.json([])),
    http.get('http://localhost:5000/api/spaces/space/consumptions/statistics', () => HttpResponse.json({ stats: [] })),
  );
}

test('the consumptions checkbox starts its real subtour and records only that completion', async () => {
  await page.viewport(1280, 800);
  const writes = vi.fn<(body: unknown) => void>();
  worker.use(
    http.get('http://localhost:5000/api/users/me/guide', () =>
      HttpResponse.json({
        guideHidden: false,
        guideVersion: 1,
        guideCompletedVersion: 1,
        guideCompletedSteps: ['consumptions'],
        guideFirstConsumptionAt: null,
      }),
    ),
    http.patch('http://localhost:5000/api/users/me/guide', async ({ request }) => {
      writes(await request.json());
      return HttpResponse.json({
        guideHidden: false,
        guideVersion: 1,
        guideCompletedVersion: 1,
        guideCompletedSteps: ['consumptions'],
        guideFirstConsumptionAt: null,
      });
    }),
  );
  const { router, queryClient } = await renderRoute({
    initialEntry: '/space?introduction=consumptions',
    overviewRoute: appRoute,
    preserveAppLayout: true,
    seedQueryClient: seed,
  });
  await expect.element(page.getByText('Switch between Monthly and Annual', { exact: false })).toBeVisible();
  await expect.poll(() => router.state.location.pathname).toBe('/space/consumptions');
  await expect.element(page.getByRole('dialog', { name: 'Add Consumption' })).not.toBeInTheDocument();
  expect(writes).not.toHaveBeenCalled();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect.element(page.getByText('Record a reading or consumption', { exact: true })).toBeVisible();
  expect(writes).not.toHaveBeenCalled();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect.poll(() => writes.mock.calls).toEqual([[{ hidden: null, completedStep: 'consumptions' }]]);
  await expect
    .poll(() => queryClient.getQueryData(queryKeys.users.guide))
    .toMatchObject({
      guideCompletedSteps: ['consumptions'],
      guideFirstConsumptionAt: null,
    });
});

test('cancelling a resource subtour leaves its checklist progress unchanged', async () => {
  await page.viewport(1280, 800);
  const write = vi.fn<() => void>();
  worker.use(
    http.patch('http://localhost:5000/api/users/me/guide', () => {
      write();
      return HttpResponse.json({});
    }),
  );
  const { router } = await renderRoute({
    initialEntry: '/space?introduction=resources',
    overviewRoute: appRoute,
    preserveAppLayout: true,
    seedQueryClient: seed,
  });
  await expect.poll(() => router.state.location.pathname).toBe('/space/consumptions/resources');
  await expect.element(page.getByText('Each resource has its own unit', { exact: false })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
  expect(write).not.toHaveBeenCalled();
});

test('the user menu opens Getting started and keeps it out of the settings navigation', async () => {
  await page.viewport(1280, 800);
  const { screen, router } = await renderRoute({
    initialEntry: '/space',
    overviewRoute: appRoute,
    preserveAppLayout: true,
    seedQueryClient: seed,
  });
  await screen.getByRole('button', { name: 'space', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Getting started', exact: true }).click();
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  expect(router.state.location.search.introduction).toBeUndefined();
  await userEvent.keyboard('{Escape}');
  await router.navigate({ to: '/settings/$section', params: { section: 'profile' } });
  expect(screen.getByRole('link', { name: 'Getting started' }).query()).toBeNull();
});

test('closing the full tour during a progress save never navigates after that save finishes', async () => {
  await page.viewport(1280, 800);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const saved = {
    guideHidden: false,
    guideVersion: 1,
    guideCompletedVersion: 1,
    guideCompletedSteps: ['dashboard'],
    guideFirstConsumptionAt: null,
  };
  const write = vi.fn<() => void>();
  worker.use(
    http.get('http://localhost:5000/api/users/me/guide', () => HttpResponse.json(saved)),
    http.patch('http://localhost:5000/api/users/me/guide', async () => {
      write();
      await gate;
      return HttpResponse.json(saved);
    }),
  );
  const { router, queryClient } = await renderRoute({
    initialEntry: '/space?introduction=tour',
    overviewRoute: appRoute,
    preserveAppLayout: true,
    seedQueryClient: seed,
  });
  try {
    await expect.element(page.getByText('Your dashboard', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect.poll(() => write.mock.calls.length).toBe(1);
    await userEvent.keyboard('{Escape}');
    release();
    await expect
      .poll(() => queryClient.getQueryData(queryKeys.users.guide))
      .toMatchObject({ guideCompletedSteps: ['dashboard'] });
    expect(router.state.location.pathname).toBe('/space');
    expect(document.querySelector('.driver-popover')).toBeNull();
  } finally {
    release();
  }
});
