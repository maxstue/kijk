import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { ConsumptionEditButton } from './edit-button';

vi.mock('@/shared/hooks/use-space-permission', () => ({
  useSpacePermission: vi.fn<() => boolean>(() => true),
}));

const navigate = vi.fn<(options: Record<string, unknown>) => void>();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params, search, to }: LinkProps) => (
    <button onClick={() => navigate({ params, search, to })}>{children}</button>
  ),
}));

interface LinkProps {
  children: ReactNode;
  params: Record<string, string>;
  search: (previous: object) => object;
  to: string;
}

beforeEach(() => {
  navigate.mockClear();
  vi.mocked(useSpacePermission).mockReturnValue(true);
});

test('navigates to the canonical consumption path and preserves search', async () => {
  const screen = await render(<ConsumptionEditButton id='consumption-42' />);
  await screen.getByRole('button', { name: 'Edit consumption' }).click();

  expect(navigate).toHaveBeenCalledWith({
    params: { consumptionId: 'consumption-42' },
    search: expect.any(Function),
    to: '/consumptions/$consumptionId',
  });
  const searchUpdater = navigate.mock.calls[0]?.[0].search as (previous: object) => object;
  const previousSearch = { month: 'september', view: 'month', year: 2026 };
  expect(searchUpdater(previousSearch)).toBe(previousSearch);
});

test('does not offer editing without the record permission', async () => {
  vi.mocked(useSpacePermission).mockReturnValue(false);
  const screen = await render(<ConsumptionEditButton id='consumption-42' />);
  expect(screen.container.querySelector('button')).toBeNull();
  expect(navigate).not.toHaveBeenCalled();
});
