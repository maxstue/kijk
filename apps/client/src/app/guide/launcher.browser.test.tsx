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
    guideHidden: false,
    guideVersion: 1,
    guideCompletedVersion: 1,
    guideCompletedSteps: options.completed ?? [],
    guideFirstConsumptionAt: null,
  };
  const write = vi.fn<(body: { hidden: boolean | null; completedStep: string | null }) => void>();
  worker.use(
    http.get('http://localhost:5000/api/users/me/guide', () => HttpResponse.json(progress)),
    http.patch('http://localhost:5000/api/users/me/guide', async ({ request }) => {
      const body = (await request.json()) as { hidden: boolean | null; completedStep: string | null };
      write(body);
      progress = {
        ...progress,
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
  await expect.poll(() => write.mock.calls).toEqual([[{ hidden: null, completedStep: 'dashboard' }]]);
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
