import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { queryKeys } from '@/shared/api/query-keys';

import { LimitsSection } from './section';

vi.mock('@/app/limits/form', () => ({ LimitForm: () => null }));

test.each([
  { role: 'Admin', permissions: [HouseholdPermissions.limits.plan], disabled: false },
  { role: 'Member', permissions: [HouseholdPermissions.limits.view], disabled: true },
  { role: 'Viewer', permissions: [HouseholdPermissions.limits.view], disabled: true },
])('$role gets limit actions matching its permissions', async ({ permissions, disabled }) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, {
    user: { households: [{ isActive: true, role: { permissions } }] },
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
  for (const name of ['Add limit', 'Edit']) {
    const button = screen.getByRole('button', { name, exact: true });
    await expect.element(button).toHaveProperty('disabled', disabled);
  }
  await screen.unmount();
  client.clear();
});
