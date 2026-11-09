import { queryKeys } from '@kijk/api/query-keys';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@kijk/ui/components/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';

import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { GuideCard } from './card';

interface FixtureOptions {
  permissions?: string[];
  resources?: unknown[];
  years?: number[];
  hidden?: boolean;
  explained?: number;
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
              'consumptions:record',
              'consumptions:view',
              'resources:configure',
              'limits:plan',
            ],
          },
        },
      ],
    },
  });
  client.setQueryData(queryKeys.resources.list('space'), options.resources ?? [{ id: 'electricity' }]);
  client.setQueryData(queryKeys.consumptions.years('space'), { years: options.years ?? [] });
  client.setQueryData(queryKeys.limits.list('space'), []);
  let progress = {
    guideHidden: options.hidden ?? false,
    guideDashboardVersion: options.explained ?? 0,
    guideFirstConsumptionAt: null,
  };
  const write = vi.fn<(body: { hidden: boolean | null; dashboardExplained: boolean | null }) => void>();
  worker.use(
    http.get('http://localhost:5000/api/users/me/guide', () => HttpResponse.json(progress)),
    http.patch('http://localhost:5000/api/users/me/guide', async ({ request }) => {
      const body = (await request.json()) as { hidden: boolean | null; dashboardExplained: boolean | null };
      write(body);
      progress = {
        ...progress,
        guideHidden: body.hidden ?? progress.guideHidden,
        guideDashboardVersion: body.dashboardExplained ? 1 : progress.guideDashboardVersion,
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
  return (
    <QueryClientProvider client={client}>
      <nav data-guide='navigation'>Consumptions and settings</nav>
      <GuideCard spaceId='space' />
      <div data-guide='dashboard'>
        <button>Choose a period and resource</button>
      </div>
      <Dialog>
        <DialogTrigger>Open example dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Example form</DialogTitle>
          <input aria-label='Example value' />
        </DialogContent>
      </Dialog>
    </QueryClientProvider>
  );
}

test.each([
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
  { width: 320, height: 568 },
  { width: 667, height: 375 },
])(
  'checklist and tour fit $width × $height, Escape restores focus and dialogs still work',
  async ({ width, height }) => {
    await page.viewport(width, height);
    const { client, write } = fixture();
    const screen = await render(<Harness client={client} />);
    try {
      const checklist = screen.getByRole('button', { name: 'Show checklist' });
      await checklist.click();
      await expect.element(page.getByText('✓ Setup completed')).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'Record your first value' })).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'Create your first limit (optional)' })).toBeVisible();
      const bounds = document.querySelector('.driver-popover')!.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.bottom).toBeLessThanOrEqual(height);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
      await expect.element(checklist).toHaveFocus();
      expect(write).not.toHaveBeenCalled();

      await screen.getByRole('button', { name: 'Get to know Kijk' }).click();
      await expect.element(page.getByText('Find your way around')).toBeVisible();
      await page.getByRole('button', { name: /Next/ }).click();
      await expect
        .element(page.getByText('A meter reading is the cumulative number on your meter.', { exact: false }))
        .toBeVisible();
      await userEvent.keyboard('{Escape}');
      expect(write).not.toHaveBeenCalled();
      await screen.getByRole('button', { name: 'Open example dialog' }).click();
      await expect.element(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('textbox', { name: 'Example value' }).fill('42');
      await expect.element(page.getByRole('textbox', { name: 'Example value' })).toHaveValue('42');
      await userEvent.keyboard('{Escape}');
    } finally {
      await screen.unmount();
      client.clear();
    }
  },
);

test('existing data from any year is labelled as space data and the optional limit does not block completion', async () => {
  const { client, write } = fixture({ years: [2020], explained: 1 });
  const screen = await render(<Harness client={client} />);
  try {
    await expect.element(screen.getByText('3 of 3 steps completed · Limits are optional.')).toBeVisible();
    await screen.getByRole('button', { name: 'Show checklist' }).click();
    await expect.element(page.getByText('✓ Entries already available in this space')).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Create your first limit (optional)' })).toBeVisible();
    expect(write).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('only completing the dashboard explanation writes progress; replaying never records a consumption', async () => {
  const { client, write } = fixture();
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Show checklist' }).click();
    await page.getByRole('button', { name: 'Get to know the dashboard' }).click();
    await expect.element(page.getByText('Understand your dashboard')).toBeVisible();
    expect(write).not.toHaveBeenCalled();
    await page.getByRole('button', { name: /Done/ }).click();
    await expect.poll(() => write.mock.calls).toEqual([[{ hidden: null, dashboardExplained: true }]]);
    await expect.element(screen.getByText('2 of 3 steps completed · Limits are optional.')).toBeVisible();
    expect(client.getQueryData(queryKeys.users.guide)).toMatchObject({ guideFirstConsumptionAt: null });
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('hidden preference survives remount and a viewer is not offered record or limit actions', async () => {
  const { client, write } = fixture({ permissions: ['consumptions:view'] });
  const screen = await render(<Harness client={client} />);
  await expect.element(screen.getByRole('button', { name: 'Show checklist' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Record a value' }).query()).toBeNull();
  expect(screen.getByRole('button', { name: 'Create a limit (optional)' }).query()).toBeNull();
  await screen.getByRole('button', { name: 'Hide checklist' }).click();
  await expect.poll(() => write.mock.calls).toEqual([[{ hidden: true, dashboardExplained: null }]]);
  await expect.element(screen.getByRole('button', { name: 'Show checklist' })).not.toBeInTheDocument();
  await screen.unmount();
  client.removeQueries({ queryKey: queryKeys.users.guide });
  const reloaded = await render(<Harness client={client} />);
  await expect.poll(() => client.getQueryData(queryKeys.users.guide)).toMatchObject({ guideHidden: true });
  expect(reloaded.getByRole('button', { name: 'Show checklist' }).query()).toBeNull();
  await reloaded.unmount();
  client.clear();
});

test('unmounting a space closes its active Driver instance', async () => {
  const { client } = fixture();
  const screen = await render(<Harness client={client} />);
  await screen.getByRole('button', { name: 'Get to know Kijk' }).click();
  await expect.element(page.getByText('Find your way around')).toBeVisible();
  await screen.unmount();
  await expect.poll(() => document.querySelector('.driver-popover')).toBeNull();
  client.clear();
});

test('a failed save keeps the checklist available and does not mark the explanation complete', async () => {
  const { client } = fixture();
  worker.use(
    http.patch('http://localhost:5000/api/users/me/guide', () =>
      HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
    ),
  );
  const screen = await render(<Harness client={client} />);
  try {
    await screen.getByRole('button', { name: 'Show checklist' }).click();
    await page.getByRole('button', { name: 'Get to know the dashboard' }).click();
    await page.getByRole('button', { name: /Done/ }).click();
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Could not save introduction progress. Please try again.');
    expect(client.getQueryData(queryKeys.users.guide)).toMatchObject({ guideDashboardVersion: 0, guideHidden: false });
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('missing resources without configuration rights never offer an impossible recording task', async () => {
  const { client } = fixture({ permissions: ['consumptions:record', 'consumptions:view'], resources: [] });
  const screen = await render(<Harness client={client} />);
  try {
    await expect
      .element(screen.getByText('Ask a space administrator to configure a resource before recording.'))
      .toBeVisible();
    await screen.getByRole('button', { name: 'Show checklist' }).click();
    expect(page.getByRole('button', { name: 'Record your first value' }).query()).toBeNull();
  } finally {
    await screen.unmount();
    client.clear();
  }
});

test('a failed history check is unknown and does not describe an existing user as new', async () => {
  const { client } = fixture();
  client.removeQueries({ queryKey: queryKeys.consumptions.years('space') });
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/consumptions/years', () =>
      HttpResponse.json({ title: 'Unavailable' }, { status: 503 }),
    ),
  );
  const screen = await render(<Harness client={client} />);
  try {
    await expect.element(screen.getByText('Some steps could not be checked.', { exact: false })).toBeVisible();
    await screen.getByRole('button', { name: 'Show checklist' }).click();
    expect(page.getByRole('button', { name: 'Record your first value' }).query()).toBeNull();
    await expect.element(page.getByRole('dialog').getByRole('button', { name: 'Record a value' })).toBeVisible();
  } finally {
    await screen.unmount();
    client.clear();
  }
});
