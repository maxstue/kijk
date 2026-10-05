import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import type { ImportJob } from '@/shared/api/imports/types';
import { queryKeys } from '@/shared/api/query-keys';

import { ImportAiCategorization } from './ai-preview';

const categorize = vi.fn<(data: unknown, options: unknown) => void>();
vi.mock('@/app/imports/use-import-mutations', () => ({
  useCategorizeImport: () => ({ isPending: false, mutate: categorize }),
  useUpdateImportAiPreviewItem: () => ({ isPending: false, mutate: vi.fn<() => void>() }),
}));

const job = { aiCategorizationUnavailable: false, aiCategorizedCount: 0, id: 'import' } as unknown as ImportJob;

function createClient(aiEnabled: boolean, aiDataSharing: 'Off' | 'Strict') {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.users.me, { status: 'Ready', user: { aiEnabled } });
  client.setQueryData(queryKeys.imports.settings(), { aiDataSharing, minimizeData: false, purposeRetention: 'Keep' });
  client.setQueryData(queryKeys.imports.aiPreview('import'), {
    items: [
      { counterparty: 'REWE Markt', excluded: false, incoming: false, key: 'a', purpose: 'Einkauf', rowCount: 2 },
      { counterparty: '[PERSON]', excluded: false, incoming: false, key: 'b', purpose: 'Miete Oktober', rowCount: 1 },
      { counterparty: 'Kino', excluded: true, incoming: false, key: 'c', purpose: null, rowCount: 1 },
    ],
    withheldRows: 1,
  });
  return client;
}

test('shows nothing when the user turned AI off', async () => {
  const client = createClient(false, 'Strict');
  const screen = await render(
    <QueryClientProvider client={client}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('What the AI would see')).not.toBeInTheDocument();
  await expect.element(screen.getByText('Suggest categories with the AI')).not.toBeInTheDocument();
  await screen.unmount();
});

test('spaces with AI off see the preview only on request', async () => {
  const client = createClient(true, 'Off');
  const screen = await render(
    <QueryClientProvider client={client}>
      <ImportAiCategorization job={job} />
    </QueryClientProvider>,
  );

  await expect.element(screen.getByText('What the AI would see')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Show what would be sent' }).click();
  await expect.element(screen.getByText('What the AI would see')).toBeVisible();
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
  await screen.getByRole('button', { name: 'Send 2 texts to the AI' }).click();
  expect(categorize).toHaveBeenCalledWith({ aiDataSharing: 'Strict' }, expect.anything());
  await screen.unmount();
});
