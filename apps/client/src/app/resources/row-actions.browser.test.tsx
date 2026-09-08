import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Resource } from '@/shared/types/domain';

import { ResourceTypeRowActions } from './row-actions';

const navigate = vi.fn<(options: Record<string, unknown>) => void>();

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/app/resources/delete-content', () => ({ ResourceTypeDeleteContent: () => null }));

beforeEach(() => navigate.mockClear());

test('update action navigates to the canonical resource path and preserves search', async () => {
  const resource: Resource = {
    color: '#123456',
    creatorType: 'User',
    id: 'resource-7',
    name: 'Electricity',
    unit: 'kWh',
  };
  const row = { original: resource } as Parameters<typeof ResourceTypeRowActions<Resource>>[0]['row'];
  const screen = await render(
    <TooltipProvider>
      <ResourceTypeRowActions canManage row={row} />
    </TooltipProvider>,
  );
  await screen.getByRole('button', { name: 'Open menu' }).click();
  await screen.getByText('Update', { exact: true }).click();

  expect(navigate).toHaveBeenCalledWith({
    params: { resourceId: 'resource-7' },
    search: expect.any(Function),
    to: '/resources/$resourceId',
  });
  const searchUpdater = navigate.mock.calls[0]?.[0].search as (previous: object) => object;
  const previousSearch = { filter: 'active' };
  expect(searchUpdater(previousSearch)).toBe(previousSearch);
});
