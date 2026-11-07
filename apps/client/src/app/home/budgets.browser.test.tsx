import { queryKeys } from '@kijk/api/query-keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, onTestFinished, test } from 'vite-plus/test';
import { page } from 'vitest/browser';

import { render } from '@/test/render-space';

import { Budgets } from './budgets';

test.for([375, 1280])('budget status changes preserve card height and following content at %ipx', async (width) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  onTestFinished(() => page.viewport(viewport.width, viewport.height));
  await page.viewport(width, 800);

  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  onTestFinished(() => client.clear());
  client.setQueryData(queryKeys.users.me, {
    user: { spaces: [{ id: 'space', role: { permissions: ['finances:view'] } }] },
  });
  const budgets = [
    {
      id: 'shopping',
      name: 'Shopping',
      amount: 50,
      spent: 0,
      remaining: 50,
      overrun: 0,
      percentage: 0,
      currency: 'EUR',
    },
    { id: 'games', name: 'Games', amount: 100, spent: 0, remaining: 100, overrun: 0, percentage: 0, currency: 'EUR' },
  ];
  const key = queryKeys.dashboard.budgets('space', 2026, 9);
  client.setQueryData(key, budgets);
  const screen = await render(
    <QueryClientProvider client={client}>
      <div className='w-full max-w-xl'>
        <Budgets spaceId='space' year={2026} month={9} />
      </div>
    </QueryClientProvider>,
  );
  onTestFinished(() => screen.unmount());
  await expect.element(screen.getByText('50 EUR remaining')).toBeVisible();
  await document.fonts.ready;

  const card = screen.getByRole('region', { name: 'Budgets' }).element();
  const nextRow = screen.getByRole('heading', { name: 'Games' }).element();
  const footer = screen.getByRole('link', { name: 'View all budgets' }).element();
  const initial = {
    height: card.getBoundingClientRect().height,
    nextRowTop: nextRow.getBoundingClientRect().top,
    footerTop: footer.getBoundingClientRect().top,
  };

  for (const spent of [173.34, 50, 0]) {
    client.setQueryData(key, [
      {
        ...budgets[0],
        spent,
        remaining: Math.max(0, 50 - spent),
        overrun: Math.max(0, spent - 50),
        percentage: (spent / 50) * 100,
      },
      budgets[1],
    ]);
    await expect
      .element(screen.getByRole('progressbar', { name: 'Shopping utilization' }))
      .toHaveAttribute('aria-valuenow', String(Math.min(100, (spent / 50) * 100)));
    expect(card.getBoundingClientRect().height).toBe(initial.height);
    expect(nextRow.getBoundingClientRect().top).toBe(initial.nextRowTop);
    expect(footer.getBoundingClientRect().top).toBe(initial.footerTop);
  }
});
