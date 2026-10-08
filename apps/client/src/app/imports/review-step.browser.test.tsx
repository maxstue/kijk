import '@kijk/ui/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { getImportCandidates } from '@/shared/api/imports/requests';
import type { ImportCandidate, ImportJob } from '@/shared/api/imports/types';
import { queryKeys } from '@/shared/api/query-keys';

import { ImportReviewStep } from './review-step';

vi.mock('@/shared/api/imports/requests', { spy: true });

const commit = vi.fn<(data: unknown, options: unknown) => void>();
vi.mock('@/app/imports/ai-preview', () => ({
  ImportAiCategorization: ({ onStarted }: { onStarted?: () => void }) => (
    <>
      <p>Preview of texts to send</p>
      <button onClick={onStarted}>Start suggestions</button>
    </>
  ),
}));
vi.mock('@/app/imports/use-import-mutations', () => ({
  useCancelImport: () => ({ isPending: false, mutate: vi.fn<() => void>() }),
  useCommitImport: () => ({ isPending: false, mutate: commit }),
  useUpdateImportCandidate: () => ({ isPending: false, mutate: vi.fn<() => void>() }),
}));

function ReviewHarness({ job, initialStage }: { job: ImportJob; initialStage: 'months' | 'review' }) {
  const [stage, setStage] = useState(initialStage);
  return <ImportReviewStep job={job} stage={stage} onStageChange={setStage} />;
}

async function renderReview(
  overrides: Partial<ImportJob> = {},
  width = 960,
  initialStage: 'months' | 'review' = 'months',
) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.categories.list(), []);
  client.setQueryData(
    queryKeys.imports.candidates('import'),
    Array.from({ length: 120 }, (_, index) => ({
      amount: '12.00',
      bookingDate: '2026-09-15',
      categoryId: null,
      counterparty: `Merchant ${index + 1}`,
      errors: null,
      excluded: false,
      id: `row-${index}`,
    })),
  );
  const job = {
    accountName: 'Test account',
    edgeMonths: ['2026-09-01'],
    fullMonths: [],
    hasHighErrorRate: false,
    id: 'import',
    ...overrides,
  } as ImportJob;
  return render(
    <QueryClientProvider client={client}>
      <div aria-label='Import review' style={{ height: 400, overflow: 'auto', width }}>
        <ReviewHarness job={job} initialStage={initialStage} />
      </div>
    </QueryClientProvider>,
  );
}

test('explains the missing month and enables saving after a month is selected', async () => {
  const screen = await renderReview();
  await expect.element(screen.getByRole('button', { name: 'Continue to review' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Save import' })).not.toBeInTheDocument();
  await expect.element(screen.getByText('Select at least one month to continue.')).toBeVisible();
  await screen.getByRole('checkbox', { name: /Confirm complete export/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await expect.element(screen.getByText(/120.*transactions ready to import/)).toBeVisible();
  await screen.getByRole('button', { name: 'Save import' }).click();
  expect(commit).toHaveBeenCalledWith({ acceptErrors: false, includedEdgeMonths: ['2026-09-01'] }, expect.anything());
  await screen.unmount();
});

test.each([360, 960])('selecting a month preserves the continue button position at %i px', async (width) => {
  const screen = await renderReview({}, width);
  const button = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent === 'Continue to review',
  )!;
  const initialTop = button.getBoundingClientRect().top;
  const checkbox = screen.getByRole('checkbox', { name: /Confirm complete export/ });
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  expect(button.getBoundingClientRect().top).toBe(initialTop);
  await checkbox.click();
  await expect.element(checkbox).not.toBeChecked();
  expect(button.getBoundingClientRect().top).toBe(initialTop);
  await screen.unmount();
});

test.each([360, 960])('keeps saving visible while scrolling through a long list at %i px', async (width) => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], edgeMonths: [] }, width);
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  const container = document.querySelector<HTMLDivElement>('[aria-label="Import review"]')!;
  container.scrollTop = 2000;
  await expect.poll(() => container.scrollTop).toBeGreaterThan(0);
  const saveButton = screen.getByRole('button', { name: 'Save import' });
  await expect.element(saveButton).toBeVisible();
  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent === 'Save import')!;
  await expect
    .poll(() => button.getBoundingClientRect().top)
    .toBeGreaterThanOrEqual(container.getBoundingClientRect().top);
  expect(button.getBoundingClientRect().bottom).toBeLessThan(container.getBoundingClientRect().bottom);
  expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(container.getBoundingClientRect().right);
  await screen.unmount();
});

test('explains why saving is blocked when unreadable rows need acknowledgement', async () => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], hasHighErrorRate: true });
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await expect.element(screen.getByRole('button', { name: 'Save import' })).toBeDisabled();
  await expect.element(screen.getByText('Confirm below that you want to skip the unreadable rows.')).toBeVisible();
  await screen.unmount();
});

test('keeps the AI preview out of the review until it is requested', async () => {
  const screen = await renderReview();
  await expect.element(screen.getByText('Preview of texts to send')).not.toBeInTheDocument();
  await screen.getByRole('checkbox', { name: /Confirm complete export/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await expect.element(screen.getByRole('dialog', { name: 'Suggest categories automatically' })).toBeVisible();
  await expect.element(screen.getByText('Preview of texts to send')).toBeVisible();
  await screen.unmount();
});

test('keeps selected months when going back from review', async () => {
  const screen = await renderReview();
  await screen.getByRole('checkbox', { name: /Confirm complete export/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await screen.getByRole('button', { name: 'Back', exact: true }).click();
  await expect.element(screen.getByRole('checkbox', { name: /Confirm complete export/ })).toBeChecked();
  await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await expect.element(screen.getByText(/120.*transactions ready to import/)).toBeVisible();
  await screen.unmount();
});

test.each([
  { status: 'Categorizing', message: 'Suggesting categories…', disabled: true },
  {
    status: 'NeedsReview',
    aiCategorizedCount: 16,
    message: '16 category suggestions ready. Check the Category column.',
    disabled: false,
  },
  {
    status: 'NeedsReview',
    aiCategorizationUnavailable: true,
    message: 'Some categories could not be suggested. Choose them or try again.',
    disabled: false,
  },
] as const)('shows AI progress and results in the review: $message', async ({ message, disabled, ...job }) => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], ...job }, 960, 'review');
  await expect.element(screen.getByText(message)).toBeVisible();
  const saveButton = Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent === 'Save import',
  )!;
  expect(saveButton.disabled).toBe(disabled);
  await screen.unmount();
});

test('closes the sharing preview after category suggestions start', async () => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'] }, 960, 'review');
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await screen.getByRole('button', { name: 'Start suggestions' }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(screen.getByRole('table')).toBeVisible();
  await screen.unmount();
});

test('refreshes category suggestions when background categorization finishes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const candidate = {
    id: 'row',
    bookingDate: '2026-09-15',
    counterparty: 'Merchant',
    amount: 12,
    errors: null,
    excluded: false,
    categoryId: null,
  } as unknown as ImportCandidate;
  client.setQueryData(queryKeys.categories.list(), [{ id: 'food', name: 'Food' }]);
  client.setQueryData(queryKeys.imports.candidates('import'), [candidate]);
  vi.mocked(getImportCandidates).mockResolvedValue([{ ...candidate, categoryId: 'food', categorySource: 'Ai' }]);
  const job = {
    id: 'import',
    fullMonths: ['2026-09-01'],
    edgeMonths: [],
    status: 'Categorizing',
    aiCategorizedCount: 0,
  } as unknown as ImportJob;
  const view = (currentJob: ImportJob) => (
    <QueryClientProvider client={client}>
      <ReviewHarness job={currentJob} initialStage='review' />
    </QueryClientProvider>
  );
  const screen = await render(view(job));
  await expect.element(screen.getByText('Suggesting categories…')).toBeVisible();
  await screen.rerender(view({ ...job, status: 'NeedsReview', aiCategorizedCount: 1 }));
  await expect.element(screen.getByText('AI suggestion')).toBeVisible();
  await expect.element(screen.getByText('1 category suggestions ready. Check the Category column.')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Save import' })).toBeEnabled();
  await screen.unmount();
  vi.mocked(getImportCandidates).mockReset();
});

test.each([360, 960])('keeps the table position stable while AI starts and finishes at %i px', async (width) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(queryKeys.categories.list(), []);
  client.setQueryData(queryKeys.imports.candidates('import'), []);
  vi.mocked(getImportCandidates).mockResolvedValue([]);
  const job = {
    id: 'import',
    fullMonths: ['2026-09-01'],
    edgeMonths: [],
    status: 'NeedsReview',
    aiCategorizedCount: 0,
  } as unknown as ImportJob;
  const view = (currentJob: ImportJob) => (
    <QueryClientProvider client={client}>
      <div style={{ width }}>
        <ReviewHarness job={currentJob} initialStage='review' />
      </div>
    </QueryClientProvider>
  );
  const screen = await render(view(job));
  const table = document.querySelector('table')!;
  const initialTop = table.getBoundingClientRect().top;
  const initialToolbarHeight = document.querySelector('[aria-label="Import actions"]')!.getBoundingClientRect().height;
  await screen.rerender(view({ ...job, status: 'Categorizing' }));
  await expect.element(screen.getByRole('status', { name: 'Suggesting categories' })).toBeVisible();
  expect(table.getBoundingClientRect().top).toBe(initialTop);
  expect(document.querySelector('[aria-label="Import actions"]')!.getBoundingClientRect().height).toBe(
    initialToolbarHeight,
  );
  expect(table.parentElement!.closest('[inert]')).not.toBeNull();
  await screen.rerender(view({ ...job, aiCategorizedCount: 16 }));
  await expect.element(screen.getByRole('status', { name: 'Suggesting categories' })).not.toBeInTheDocument();
  expect(table.getBoundingClientRect().top).toBe(initialTop);
  expect(document.querySelector('[aria-label="Import actions"]')!.getBoundingClientRect().height).toBe(
    initialToolbarHeight,
  );
  await screen.rerender(view({ ...job, aiCategorizationUnavailable: true }));
  expect(table.getBoundingClientRect().top).toBe(initialTop);
  expect(document.querySelector('[aria-label="Import actions"]')!.getBoundingClientRect().height).toBe(
    initialToolbarHeight,
  );
  await screen.unmount();
  vi.mocked(getImportCandidates).mockReset();
});
