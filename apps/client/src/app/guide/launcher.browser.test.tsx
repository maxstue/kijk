import { queryKeys } from '@kijk/api/query-keys';
import { SidebarProvider } from '@kijk/ui/components/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { GuideLauncher } from './launcher';

interface FixtureOptions {
  permissions?: string[];
  finances?: boolean;
  completed?: string[];
  version?: number;
}

function fixture(options: FixtureOptions = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(queryKeys.users.me, {
    status: 'Ready',
    user: {
      spaces: [
        {
          id: 'space',
          role: {
            permissions: options.permissions ?? [
              'consumptions:view',
              'consumptions:record',
              'resources:view',
              'limits:view',
            ],
          },
        },
      ],
    },
  });
  client.setQueryData(queryKeys.users.features, { finances: options.finances ?? false });
  let progress = {
    guideVersion: 1,
    guideCompletedVersion: options.version ?? 1,
    guideCompletedSteps: options.completed ?? [],
    guideCompletedAt: null as string | null,
  };
  const write = vi.fn<(body: { completedTour: boolean; completedStep: string | null }) => void>();
  worker.use(
    http.get('http://localhost:5000/api/users/me/guide', () => HttpResponse.json(progress)),
    http.patch('http://localhost:5000/api/users/me/guide', async ({ request }) => {
      const body = (await request.json()) as { completedTour: boolean; completedStep: string | null };
      write(body);
      progress = {
        ...progress,
        guideCompletedVersion: body.completedTour || body.completedStep ? 1 : progress.guideCompletedVersion,
        guideCompletedAt: body.completedTour ? '2026-11-10T09:00:00Z' : progress.guideCompletedAt,
        guideCompletedSteps: [
          ...new Set([...progress.guideCompletedSteps, ...(body.completedStep ? [body.completedStep] : [])]),
        ],
      };
      return HttpResponse.json(progress);
    }),
  );
  return { client, write };
}

interface Props {
  client: QueryClient;
}
function Harness({ client }: Props) {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  return (
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <button
          data-guide='account'
          onClick={() =>
            void navigate({ to: '/$spaceId', params: { spaceId: 'space' }, search: { introduction: 'checklist' } })
          }
        >
          Getting started
        </button>
        <GuideLauncher spaceId='space' request={search.introduction} />
        <div data-guide='dashboard'>
          <button>Choose a period and resource</button>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

test.each([
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
  { width: 320, height: 568 },
  { width: 667, height: 375 },
])('native checklist fits $width × $height and Escape restores focus', async ({ width, height }) => {
  await page.viewport(width, height);
  const { client, write } = fixture();
  const screen = await render(<Harness client={client} />);
  try {
    const trigger = screen.getByRole('button', { name: 'Getting started' });
    await trigger.click();
    await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
    await expect
      .element(page.getByRole('progressbar', { name: 'Getting started progress' }))
      .toHaveAttribute('aria-valuenow', '0');
    await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
    await expect.element(page.getByRole('button', { name: /^Dashboard/ })).toBeVisible();
    const bounds = document.querySelector('[data-slot="dialog-content"]')!.getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);
    expect(bounds.bottom).toBeLessThanOrEqual(height);
    await userEvent.keyboard('{Escape}');
    await expect.element(trigger).toHaveFocus();
    expect(write).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('a checkbox starts only its subtour and completion updates native progress across remounts', async () => {
  const { client, write } = fixture();
  const screen = await render(<Harness client={client} />);
  await screen.getByRole('button', { name: 'Getting started' }).click();
  await page.getByRole('button', { name: /^Dashboard/ }).click();
  await expect.element(page.getByText('Your dashboard', { exact: true })).toBeVisible();
  expect(write).not.toHaveBeenCalled();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect.poll(() => write.mock.calls).toEqual([[{ completedTour: false, completedStep: 'dashboard' }]]);
  await screen.getByRole('button', { name: 'Getting started' }).click();
  await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  expect(
    document
      .querySelector('[data-item-id="dashboard"]')
      ?.closest('li')
      ?.classList.contains('driver-checklist-item-done'),
  ).toBe(true);
  await screen.unmount();
  client.removeQueries({ queryKey: queryKeys.users.guide });
  const remounted = await render(<Harness client={client} />);
  await remounted.getByRole('button', { name: 'Getting started' }).click();
  await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await remounted.unmount();
  client.clear();
});

test('aborting a subtour does not tick its checkbox or write progress', async () => {
  const { client, write } = fixture();
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await page.getByRole('button', { name: /^Spaces & settings/ }).click();
    await expect.element(page.getByText('Switch spaces and open settings', { exact: true })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(write).not.toHaveBeenCalled();
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('the main button starts the full tour without marking anything on start', async () => {
  const { client, write } = fixture();
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await page.getByRole('button', { name: 'Get to know Kijk' }).click();
    await expect.element(page.getByText('Your dashboard', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    expect(write).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(write).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('a failed progress write reopens the checklist with unchanged completion', async () => {
  const { client } = fixture();
  worker.use(
    http.patch('http://localhost:5000/api/users/me/guide', () =>
      HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
    ),
  );
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await page.getByRole('button', { name: /^Dashboard/ }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Could not save introduction progress. Please try again.');
    await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('dialog', { name: 'Getting started' })).not.toBeInTheDocument();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test.each(['subtour', 'full tour'] as const)(
  'a failed save can restart the $0 directly without overlapping dialogs',
  async (retry) => {
    const { client, write } = fixture({ permissions: [] });
    worker.use(
      http.patch(
        'http://localhost:5000/api/users/me/guide',
        () => HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
        { once: true },
      ),
    );
    const screen = await render(<Harness client={client} />);
    try {
      await screen.getByRole('button', { name: 'Getting started' }).click();
      await page.getByRole('button', { name: /^Dashboard/ }).click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Could not save introduction progress. Please try again.');

      await page.getByRole('button', { name: retry === 'subtour' ? /^Dashboard/ : 'Get to know Kijk' }).click();
      await expect.element(page.getByText('Your dashboard', { exact: true })).toBeVisible();
      await expect.poll(() => document.querySelector('[data-slot="dialog-content"][data-open]')).toBeNull();
      await expect.poll(() => document.querySelector('[role="alert"]')).toBeNull();
      if (retry === 'full tour') {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
      await expect
        .element(
          page.getByText(retry === 'subtour' ? 'Your dashboard' : 'Switch spaces and open settings', { exact: true }),
        )
        .toBeVisible();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
      expect(write).toHaveBeenCalledTimes(retry === 'subtour' ? 1 : 2);
      expect(client.getQueryData(queryKeys.users.guide)).toMatchObject({
        guideCompletedSteps: retry === 'subtour' ? ['dashboard'] : ['dashboard', 'navigation'],
      });
    } finally {
      await screen.unmount();
      client.clear();
    }
  },
);

test('replaying an already completed section does not duplicate writes', async () => {
  const { client, write } = fixture({ completed: ['dashboard'] });
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await page.getByRole('button', { name: /^Dashboard/ }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
    expect(write).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test.each([
  { finances: true, permissions: ['finances:view'], visible: true },
  { finances: false, permissions: ['finances:view'], visible: false },
  { finances: true, permissions: ['consumptions:view'], visible: false },
])('finance subtour respects flag $finances and space permissions', async ({ finances, permissions, visible }) => {
  const { client } = fixture({ finances, permissions });
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await expect.element(page.getByRole('region', { name: 'Your checklist' })).toBeVisible();
    expect(Boolean(page.getByRole('button', { name: /^Finances/ }).query())).toBe(visible);
    expect(page.getByRole('button', { name: 'Explore finances' }).query()).toBeNull();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('only finishing a full tour records its date, including a replay with completed checkboxes', async () => {
  const { client, write } = fixture({ permissions: [], completed: ['dashboard', 'navigation'] });
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Getting started' }).click();
    expect(page.getByText(/Tour last completed/).query()).toBeNull();
    await page.getByRole('button', { name: 'Get to know Kijk' }).click();
    await expect.element(page.getByText('Your dashboard', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect.element(page.getByText('Switch spaces and open settings', { exact: true })).toBeVisible();
    expect(write).not.toHaveBeenCalled();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect.poll(() => write.mock.calls).toEqual([[{ completedStep: 'navigation', completedTour: true }]]);
    await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
    await screen.getByRole('button', { name: 'Getting started' }).click();
    await expect.element(page.getByText(/Tour last completed/)).toBeVisible();
    expect(document.querySelector('time')?.dateTime).toBe('2026-11-10T09:00:00Z');
    await page.getByRole('button', { name: 'Get to know Kijk' }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect.element(page.getByText('Switch spaces and open settings', { exact: true })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(write).toHaveBeenCalledTimes(1);
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('new progress opens automatically, stays dismissible, and opens again after a fresh mount', async () => {
  const { client, write } = fixture({ version: 0 });
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).not.toBeInTheDocument();
  expect(write).not.toHaveBeenCalled();
  await screen.unmount();
  const reloaded = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  await reloaded.unmount();
  client.clear();
});

test('existing partial progress does not open automatically', async () => {
  const { client } = fixture({ completed: ['dashboard'] });
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await expect.poll(() => client.getQueryState(queryKeys.users.guide)?.status).toBe('success');
  expect(page.getByRole('dialog', { name: 'Getting started' }).query()).toBeNull();
  await screen.unmount();
  client.clear();
});

test('skip records completion without ticking sections and stays closed after reloading', async () => {
  const { client, write } = fixture({ version: 0 });
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect.poll(() => write.mock.calls).toEqual([[{ completedStep: null, completedTour: true }]]);
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).not.toBeInTheDocument();
  await screen.unmount();
  client.removeQueries({ queryKey: queryKeys.users.guide });
  const reloaded = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await expect
    .poll(() => client.getQueryData(queryKeys.users.guide))
    .toMatchObject({ guideCompletedSteps: [], guideCompletedAt: '2026-11-10T09:00:00Z' });
  expect(page.getByRole('dialog', { name: 'Getting started' }).query()).toBeNull();
  await reloaded.unmount();
  client.clear();
});

test('a failed skip keeps the modal open and progress unchanged', async () => {
  const { client } = fixture({ version: 0 });
  worker.use(
    http.patch('http://localhost:5000/api/users/me/guide', () =>
      HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
    ),
  );
  const screen = await render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <GuideLauncher spaceId='space' autoOpen />
      </SidebarProvider>
    </QueryClientProvider>,
  );
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Could not save introduction progress. Please try again.');
  await expect.element(page.getByRole('dialog', { name: 'Getting started' })).toBeVisible();
  expect(client.getQueryData(queryKeys.users.guide)).toMatchObject({
    guideCompletedVersion: 0,
    guideCompletedAt: null,
    guideCompletedSteps: [],
  });
  await screen.unmount();
  client.clear();
});
