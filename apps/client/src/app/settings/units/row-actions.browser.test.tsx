import * as unitsApi from '@kijk/api/units/requests';
import type { Unit } from '@kijk/api/units/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, expect, onTestFinished, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { UnitRowActions } from './row-actions';

vi.mock('@kijk/api/units/requests', { spy: true });
vi.mock('sonner', { spy: true });

const unit = {
  id: 'unit',
  name: 'Bucket',
  isOwner: true,
  isArchived: false,
  spaceIds: ['existing'],
  resourceCount: 0,
  conversionType: 'Factor',
} as Unit;
const shareableSpaces = [
  { id: 'existing', name: 'Existing' },
  { id: 'family', name: 'Family' },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(unitsApi.shareWithSpace).mockResolvedValue(undefined);
  vi.mocked(unitsApi.removeFromSpace).mockResolvedValue(undefined);
  vi.mocked(unitsApi.restore).mockResolvedValue(undefined);
});

async function openMenu(overrides: Partial<Parameters<typeof UnitRowActions>[0]> = {}) {
  const client = new QueryClient();
  const screen = await render(
    <QueryClientProvider client={client}>
      <UnitRowActions unit={unit} scope='personal' shareableSpaces={shareableSpaces} {...overrides} />
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  await screen.getByRole('button', { name: 'Open menu' }).click();
  return screen;
}

test('offers only spaces the unit is not shared with and shares with the selected space', async () => {
  const pending = Promise.withResolvers<void>();
  vi.mocked(unitsApi.shareWithSpace).mockReturnValueOnce(pending.promise);
  const screen = await openMenu();
  await expect.element(screen.getByRole('menuitem', { name: 'Share with Existing' })).not.toBeInTheDocument();
  await screen.getByRole('menuitem', { name: 'Share with Family' }).click();
  await vi.waitFor(() => expect(unitsApi.shareWithSpace).toHaveBeenCalledExactlyOnceWith('unit', 'family'));
  await expect.element(screen.getByRole('menu')).not.toBeInTheDocument();
  pending.resolve();
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Unit shared with space'));
});

test.each([
  { isOwner: false, isArchived: false },
  { isOwner: true, isArchived: true },
])('does not offer sharing for $isOwner ownership and $isArchived archive state', async (state) => {
  const screen = await openMenu({ unit: { ...unit, ...state } });
  await expect.element(screen.getByRole('menuitem', { name: 'Share with Family' })).not.toBeInTheDocument();
});

test('removes an owned unit from a space with sharing permission', async () => {
  const screen = await openMenu({ scope: 'space', spaceId: 'existing' });
  await screen.getByRole('menuitem', { name: 'Remove from space' }).click();
  await vi.waitFor(() => expect(unitsApi.removeFromSpace).toHaveBeenCalledExactlyOnceWith('unit', 'existing'));
});

test.each([{ unit: { ...unit, isOwner: false } }, { shareableSpaces: [] }])(
  'disables removal without ownership or sharing permission (%#)',
  async (overrides) => {
    const screen = await openMenu({ scope: 'space', spaceId: 'existing', ...overrides });
    await expect
      .element(screen.getByRole('menuitem', { name: 'Remove from space' }))
      .toHaveAttribute('aria-disabled', 'true');
    expect(unitsApi.removeFromSpace).not.toHaveBeenCalled();
  },
);

test('restores archived units and keeps deletion disabled while shared', async () => {
  const screen = await openMenu({ unit: { ...unit, isArchived: true } });
  await expect
    .element(screen.getByRole('menuitem', { name: 'Delete', exact: true }))
    .toHaveAttribute('aria-disabled', 'true');
  await screen.getByRole('menuitem', { name: 'Restore' }).click();
  await vi.waitFor(() => expect(unitsApi.restore).toHaveBeenCalledExactlyOnceWith('unit'));
});
