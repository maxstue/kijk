import '@kijk/ui/globals.css';
import * as importsApi from '@kijk/api/imports/requests';
import type { ImportJob } from '@kijk/api/imports/types';
import { queryKeys } from '@kijk/api/query-keys';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, onTestFinished, test, vi } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { ImportAiCategorization } from './ai-preview';

vi.mock('@kijk/api/imports/requests', { spy: true });

afterEach(() => vi.mocked(importsApi.startCategorization).mockReset());

type CategorizeResult = Awaited<ReturnType<typeof importsApi.startCategorization>>;

const job = { aiCategorizationUnavailable: false, aiCategorizedCount: 0, id: 'import' } as unknown as ImportJob;

function createClient(aiEnabled: boolean, aiDataSharing: 'Off' | 'Strict') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  onTestFinished(() => client.clear());
  client.setQueryData(queryKeys.users.me, { status: 'Ready', user: { aiEnabled } });
  client.setQueryData(queryKeys.imports.settings('space'), {
    aiDataSharing,
    minimizeData: false,
    purposeRetention: 'Keep',
  });
  client.setQueryData(queryKeys.imports.aiPreview('space', 'import'), {
    items: [
      { counterparty: 'REWE Markt', excluded: false, incoming: false, key: 'a', purpose: 'Einkauf', rowCount: 2 },
      { counterparty: '[PERSON]', excluded: false, incoming: false, key: 'b', purpose: 'Miete Oktober', rowCount: 1 },
      { counterparty: 'Kino', excluded: true, incoming: false, key: 'c', purpose: null, rowCount: 1 },
    ],
    withheldRows: 1,
  });
  return client;
}

test('only hints at the setting while the user has not turned AI on', async () => {
  const client = createClient(false, 'Strict');
  const screen = await render(
    <QueryClientProvider client={client}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('What the AI would see')).not.toBeInTheDocument();
  await expect.element(screen.getByText('Suggest categories with the AI')).not.toBeInTheDocument();
  await expect.element(screen.getByText(/AI category suggestions are off/)).toBeInTheDocument();
  await screen.unmount();
});

test('opens the preview directly even when automatic AI is off for the space', async () => {
  const screen = await render(
    <QueryClientProvider client={createClient(true, 'Off')}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByText('What the AI would see')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Show what would be sent' })).not.toBeInTheDocument();
  await screen.unmount();
});

test('the preview lists exactly the selected texts and sends only those', async () => {
  const client = createClient(true, 'Strict');
  const screen = await render(
    <QueryClientProvider client={client}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('Miete Oktober')).toBeVisible();
  await expect.element(screen.getByText(/2 texts for 3 rows · 1 rows withheld/)).toBeVisible();
  const deselected = screen.getByRole('checkbox', { name: 'Send this text to the AI' }).nth(2);
  await expect.element(deselected).not.toBeChecked();
  vi.mocked(importsApi.startCategorization).mockResolvedValue({} as CategorizeResult);
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await vi.waitFor(() =>
    expect(importsApi.startCategorization).toHaveBeenCalledWith('space', 'import', {
      aiDataSharing: 'Strict',
      selectedTextKeys: ['a', 'b'],
    }),
  );
  await screen.unmount();
});

test.each([360, 768])('keeps a long AI preview inside a %i px dialog', async (width) => {
  const client = createClient(true, 'Strict');
  client.setQueryData(queryKeys.imports.aiPreview('space', 'import'), {
    items: Array.from({ length: 30 }, (_, index) => ({
      counterparty: 'A very long merchant name that must stay inside the table',
      excluded: false,
      incoming: false,
      key: `long-${index}`,
      purpose: 'A very long payment reference '.repeat(20),
      rowCount: 1,
    })),
    withheldRows: 0,
  });
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dialog open>
        <DialogContent style={{ width }}>
          <DialogHeader>
            <DialogTitle>AI category suggestions</DialogTitle>
            <DialogDescription>Review what would be sent before requesting suggestions.</DialogDescription>
          </DialogHeader>
          <ImportAiCategorization job={job} />
        </DialogContent>
      </Dialog>
    </QueryClientProvider>,
  );
  await expect.element(screen.getByRole('button', { name: 'Suggest categories' })).toBeInTheDocument();
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
  const tableContainer = dialog.querySelector<HTMLElement>('[data-slot="table-container"]')!;
  expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
  expect(tableContainer.scrollWidth).toBeGreaterThan(tableContainer.clientWidth);
  const send = Array.from(dialog.querySelectorAll('button')).find(
    (button) => button.textContent === 'Suggest categories',
  )!;
  expect(send.getBoundingClientRect().right).toBeLessThanOrEqual(dialog.getBoundingClientRect().right);
  expect(tableContainer.getBoundingClientRect().right).toBeLessThanOrEqual(dialog.getBoundingClientRect().right);
  await screen.unmount();
});

test('returns to the transaction review only after the request succeeds', async () => {
  const onStarted = vi.fn<() => void>();
  const screen = await render(
    <QueryClientProvider client={createClient(true, 'Strict')}>
      <ImportAiCategorization job={job} onStarted={onStarted} />
    </QueryClientProvider>,
  );
  const { promise, resolve } = Promise.withResolvers<CategorizeResult>();
  vi.mocked(importsApi.startCategorization).mockReturnValue(promise);
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await vi.waitFor(() => expect(importsApi.startCategorization).toHaveBeenCalledOnce());
  expect(onStarted).not.toHaveBeenCalled();
  resolve({} as CategorizeResult);
  await vi.waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
  await screen.unmount();
});

test('keeps checkbox changes local and submits the final selection once', async () => {
  vi.mocked(importsApi.startCategorization).mockResolvedValue({} as CategorizeResult);
  const client = createClient(true, 'Strict');
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const screen = await render(
    <QueryClientProvider client={client}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );
  const checkboxes = screen.getByRole('checkbox', { name: 'Send this text to the AI' });
  await checkboxes.nth(0).click();
  await checkboxes.nth(2).click();
  await expect.element(checkboxes.nth(0)).not.toBeChecked();
  await expect.element(checkboxes.nth(2)).toBeChecked();
  await expect.element(screen.getByText(/2 texts for 2 rows/)).toBeVisible();
  expect(invalidate).not.toHaveBeenCalled();
  expect(importsApi.startCategorization).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await vi.waitFor(() =>
    expect(importsApi.startCategorization).toHaveBeenCalledExactlyOnceWith('space', 'import', {
      aiDataSharing: 'Strict',
      selectedTextKeys: ['b', 'c'],
    }),
  );
  await screen.unmount();
});
