import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { ConsumptionYearSwitcher } from './year-switcher';

interface NavigationOptions {
  to?: string;
  params?: { spaceId: string };
  search: (previous: Record<string, unknown>) => Record<string, unknown>;
}

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn<(options: NavigationOptions) => void>(),
}));

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({ useSearch: () => ({ year: 2035 }), useNavigate: () => navigate }),
}));
vi.mock('@/shared/hooks/use-active-space', () => ({ useSpaceId: () => 'space' }));

beforeEach(() => navigate.mockClear());

async function renderYearPicker() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const queryKey = consumptionsOptions.yearsQueryOptions('space').queryKey;
  const years = [2026];
  Object.freeze(years);
  queryClient.setQueryData(queryKey, { years });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ConsumptionYearSwitcher />
    </QueryClientProvider>,
  );
  return { screen, queryClient, queryKey, years };
}

test('offers the URL year without mutating the cached server years', async () => {
  const { screen, queryClient, queryKey, years } = await renderYearPicker();
  try {
    await screen.getByRole('combobox', { name: 'Select a year' }).click();
    await expect.element(screen.getByRole('option', { name: '2035' })).toBeVisible();
    await expect.element(screen.getByRole('option', { name: '2026' })).toBeVisible();
    expect(queryClient.getQueryData(queryKey)).toEqual({ years: [2026] });
    expect(years).toEqual([2026]);
  } finally {
    await screen.unmount();
    queryClient.clear();
  }
});

test('accepts an edited numeric year and preserves existing search parameters when navigating', async () => {
  const { screen, queryClient, queryKey } = await renderYearPicker();
  try {
    await screen.getByRole('combobox', { name: 'Select a year' }).click();
    await screen.getByText('Add new year', { exact: true }).click();
    await screen.getByRole('spinbutton', { name: 'Year', exact: true }).fill('2036');
    await screen.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect.poll(() => navigate.mock.calls.length).toBe(1);
    expect(queryClient.getQueryData(queryKey)).toEqual({ years: [2036, 2026] });
    const options = navigate.mock.calls[0]?.[0];
    expect(options).toMatchObject({ to: '/$spaceId/consumptions', params: { spaceId: 'space' } });
    expect(options?.search({ month: 'june', year: 2035 })).toEqual({ month: 'june', year: 2036 });
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  } finally {
    await screen.unmount();
    queryClient.clear();
  }
});

test('Cancel closes the new-year dialog without changing years or navigating', async () => {
  const { screen, queryClient, queryKey } = await renderYearPicker();
  try {
    await screen.getByRole('combobox', { name: 'Select a year' }).click();
    await screen.getByText('Add new year', { exact: true }).click();
    await screen.getByRole('spinbutton', { name: 'Year', exact: true }).fill('2040');
    await screen.getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(queryClient.getQueryData(queryKey)).toEqual({ years: [2026] });
    expect(navigate).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
    queryClient.clear();
  }
});
