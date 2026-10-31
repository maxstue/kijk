import '@kijk/ui/globals.css';
import * as importsOptions from '@kijk/api/imports/options';
import * as importsApi from '@kijk/api/imports/requests';
import type { ImportCandidate, ImportCandidatePage, ImportCandidatesQuery, ImportJob } from '@kijk/api/imports/types';
import { queryKeys } from '@kijk/api/query-keys';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { afterEach, expect, onTestFinished, test, vi } from 'vite-plus/test';

import { render } from '@/test/render-space';

import { ImportReviewStep } from './review-step';
import { ImportSteps } from './steps';

vi.mock('@kijk/api/imports/requests', { spy: true });

vi.mock('@/app/imports/ai-preview', () => ({
  ImportAiCategorization: ({ onStarted }: { onStarted?: () => void }) => (
    <>
      <p>Preview of texts to send</p>
      <button onClick={onStarted}>Start suggestions</button>
    </>
  ),
}));

afterEach(() => {
  vi.mocked(importsApi.commit).mockReset();
  vi.mocked(importsApi.getCandidates).mockReset();
  vi.mocked(importsApi.updateCandidate).mockReset();
  vi.mocked(importsApi.getDetails).mockReset();
  vi.mocked(importsApi.resetOverrides).mockReset();
});

function ReviewHarness({ job, initialStage }: { job: ImportJob; initialStage: 'months' | 'review' }) {
  const [stage, setStage] = useState(initialStage);
  return <ImportReviewStep job={job} stage={stage} onStageChange={setStage} />;
}

function PolledReviewHarness() {
  const { data } = useQuery(importsOptions.detailsQueryOptions('space', 'import'));
  return data ? <ReviewHarness job={data} initialStage='review' /> : null;
}

function candidatePage(rows: ImportCandidate[], params: ImportCandidatesQuery = {}): ImportCandidatePage {
  const selected = rows.filter(
    (row) => params.months === undefined || params.months.split(',').includes(`${row.bookingDate?.slice(0, 7)}-01`),
  );
  const filtered = params.cardSettlementsOnly
    ? selected.filter((row) => row.isCardSettlement && !row.excluded)
    : selected;
  const pageSize = params.pageSize ?? 100;
  const page = Math.min(params.page ?? 1, Math.max(1, Math.ceil(filtered.length / pageSize)));
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: filtered.length,
    includedCount: selected.filter((row) => !row.excluded).length,
    cardSettlementCount: selected.filter((row) => row.isCardSettlement && !row.excluded).length,
    errorCount: 0,
    errorSamples: [],
  };
}

async function renderReview(
  overrides: Partial<ImportJob> = {},
  width = 960,
  initialStage: 'months' | 'review' = 'months',
  rowCount = 120,
  customRows?: ImportCandidate[],
  openAdjust = true,
) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  onTestFinished(() => client.clear());
  client.setQueryData(queryKeys.categories.list('space'), [
    { id: 'food', name: 'Food' },
    { id: 'shopping', name: 'Shopping' },
  ]);
  const rows =
    customRows ??
    (Array.from({ length: rowCount }, (_, index) => ({
      amount: 12,
      bookingDate: '2026-09-15',
      categoryId: null,
      counterparty: `Merchant ${index + 1}`,
      errors: null,
      excluded: false,
      id: `row-${index}`,
    })) as unknown as ImportCandidate[]);
  vi.mocked(importsApi.getCandidates).mockImplementation(async (_spaceId, _id, params) => candidatePage(rows, params));
  vi.mocked(importsApi.updateCandidate).mockImplementation(async (_spaceId, { candidateId, candidate }) => {
    const index = rows.findIndex((row) => row.id === candidateId);
    const updated = {
      ...rows[index],
      ...candidate,
      ...(candidate.categoryId !== rows[index].categoryId
        ? { categorySource: candidate.categoryId ? ('Manual' as const) : null }
        : {}),
      countsAsOffset: candidate.countsAsOffset ?? rows[index].countsAsOffset ?? false,
    };
    rows.splice(index, 1, updated);
    return updated;
  });
  vi.mocked(importsApi.resetOverrides).mockImplementation(async () => {
    let count = 0;
    rows.forEach((row, index) => {
      if (row.categorySource === 'Manual') {
        rows[index] = { ...row, categoryId: null, categorySource: null };
        count++;
      }
    });
    return count;
  });
  client.setQueryData(
    importsOptions.candidatesQueryOptions('space', 'import', { months: '2026-09-01', page: 1 }).queryKey,
    candidatePage(rows),
  );
  const job = {
    accountName: 'Test account',
    edgeMonths: ['2026-09-01'],
    fullMonths: [],
    hasHighErrorRate: false,
    id: 'import',
    ...overrides,
  } as ImportJob;
  const screen = await render(
    <QueryClientProvider client={client}>
      <div aria-label='Import review' style={{ height: 400, overflow: 'auto', width }}>
        <ReviewHarness job={job} initialStage={initialStage} />
      </div>
    </QueryClientProvider>,
  );
  if (initialStage === 'review' && openAdjust) {
    await screen.getByRole('button', { name: 'Adjust transactions' }).click();
  }
  return screen;
}

test.each([360, 960])('can review and edit rows beyond the former 300-row limit at %i px', async (width) => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], edgeMonths: [] }, width, 'review', 301);
  const previous = screen.getByRole('button', { name: 'Previous rows' });
  const next = screen.getByRole('button', { name: 'Next rows' });
  await expect.element(previous).toBeDisabled();
  for (let page = 0; page < 3; page++) {
    await next.click();
  }
  await expect.element(screen.getByText('Merchant 301', { exact: true })).toBeVisible();
  expect(importsApi.getCandidates).toHaveBeenCalledWith(
    'space',
    'import',
    { months: '2026-09-01', page: 4, pageSize: 100, cardSettlementsOnly: false },
    expect.any(AbortSignal),
  );
  await expect.element(next).toBeDisabled();

  await screen.getByRole('checkbox', { name: 'Import this row' }).click();
  await expect.element(screen.getByRole('checkbox', { name: 'Import this row' })).not.toBeChecked();
  await vi.waitFor(() =>
    expect(importsApi.updateCandidate).toHaveBeenCalledWith('space', {
      importId: 'import',
      candidateId: 'row-300',
      candidate: { categoryId: null, excluded: true },
    }),
  );
  await expect.element(screen.getByText(/300.*transactions ready to import/).first()).toBeVisible();
  await expect.element(screen.getByRole('checkbox', { name: 'Import this row' })).toBeEnabled();
  await previous.click();
  await next.click();
  await expect.element(screen.getByRole('checkbox', { name: 'Import this row' })).not.toBeChecked();
  const navigation = document.querySelector<HTMLElement>('[aria-label="Transaction pages"]')!;
  expect(navigation.scrollWidth).toBeLessThanOrEqual(navigation.clientWidth);
  await screen.unmount();
});

test('changing selected months requests page one and updates the selection-wide total', async () => {
  const rows = Array.from({ length: 203 }, (_, index) => ({
    id: `row-${index}`,
    bookingDate: index < 201 ? '2026-09-15' : '2026-10-15',
    counterparty: `Merchant ${index + 1}`,
    amount: 12,
    categoryId: null,
    excluded: false,
    errors: null,
  })) as unknown as ImportCandidate[];
  const screen = await renderReview(
    { fullMonths: ['2026-09-01'], edgeMonths: ['2026-10-01'] },
    960,
    'review',
    203,
    rows,
  );
  const next = screen.getByRole('button', { name: 'Next rows' });
  await next.click();
  await next.click();
  await expect.element(screen.getByText('Merchant 201', { exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Back', exact: true }).first().click();
  await screen.getByRole('checkbox', { name: /Import partial month/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  const adjust = screen.getByRole('button', { name: /^(Adjust transactions|Hide transactions)$/ });
  if (adjust.element().getAttribute('aria-expanded') === 'false') {
    await adjust.click();
  }
  await expect.element(screen.getByText('Merchant 1', { exact: true })).toBeVisible();
  await expect.element(screen.getByText(/203.*transactions ready to import/)).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Previous rows' })).toBeDisabled();
  expect(importsApi.getCandidates).toHaveBeenCalledWith(
    'space',
    'import',
    {
      months: '2026-09-01,2026-10-01',
      page: 1,
      pageSize: 100,
      cardSettlementsOnly: false,
    },
    expect.any(AbortSignal),
  );
  await screen.unmount();
});

test('blocks saving while a new page loads and allows retry after a failed request', async () => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], edgeMonths: [] }, 960, 'review', 201);
  const implementation = vi.mocked(importsApi.getCandidates).getMockImplementation()!;
  const pending = Promise.withResolvers<ImportCandidatePage>();
  vi.mocked(importsApi.getCandidates).mockImplementation((spaceId, id, params, signal) =>
    params?.page === 2 ? pending.promise : implementation(spaceId, id, params, signal),
  );
  await screen.getByRole('button', { name: 'Next rows' }).click();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeDisabled();
  pending.reject(new Error('Unavailable'));
  await expect.element(screen.getByText('Transactions could not be loaded')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeDisabled();
  vi.mocked(importsApi.getCandidates).mockImplementation(implementation);
  await screen.getByRole('button', { name: 'Try again' }).click();
  await expect.element(screen.getByText('Merchant 101', { exact: true })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeEnabled();
  await screen.unmount();
});

test('loads card statements outside the visible transaction page only when expanded', async () => {
  const rows = Array.from({ length: 102 }, (_, index) => ({
    id: `row-${index}`,
    bookingDate: '2026-09-15',
    counterparty: `Merchant ${index + 1}`,
    amount: 12,
    categoryId: null,
    excluded: false,
    errors: null,
    isCardSettlement: index >= 100,
    countsAsOffset: false,
  })) as unknown as ImportCandidate[];
  const screen = await renderReview({ fullMonths: ['2026-09-01'], edgeMonths: [] }, 960, 'review', 102, rows);
  const cardRequests = () =>
    vi.mocked(importsApi.getCandidates).mock.calls.filter(([, , query]) => query?.cardSettlementsOnly);
  expect(cardRequests()).toHaveLength(0);
  await screen.getByText('2 credit card statements were found').click();
  await expect.element(screen.getByText(/Merchant 101.*purchases imported separately/)).toBeVisible();
  expect(cardRequests()).toHaveLength(1);
  const checkbox = screen.getByRole('checkbox', { name: /Merchant 101.*purchases imported separately/ });
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  await screen.unmount();
});

test('explains the missing month and enables saving after a month is selected', async () => {
  vi.mocked(importsApi.commit).mockResolvedValue({ importedCount: 120 } as Awaited<
    ReturnType<typeof importsApi.commit>
  >);
  const screen = await renderReview();
  await expect.element(screen.getByRole('button', { name: 'Continue to review' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).not.toBeInTheDocument();
  await expect.element(screen.getByText('Select at least one month to continue.')).toBeVisible();
  await screen.getByRole('checkbox', { name: /Import partial month/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await expect.element(screen.getByText(/120.*transactions ready to import/)).toBeVisible();
  await screen.getByRole('button', { name: 'Start import' }).first().click();
  await vi.waitFor(() =>
    expect(importsApi.commit).toHaveBeenCalledWith('space', 'import', {
      acceptErrors: false,
      includedEdgeMonths: ['2026-09-01'],
    }),
  );
  await screen.unmount();
});

test.each([360, 960])('selecting a month preserves the continue button position at %i px', async (width) => {
  const screen = await renderReview({}, width);
  const button = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent === 'Continue to review',
  )!;
  const initialTop = button.getBoundingClientRect().top;
  const checkbox = screen.getByRole('checkbox', { name: /Import partial month/ });
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  expect(button.getBoundingClientRect().top).toBe(initialTop);
  await checkbox.click();
  await expect.element(checkbox).not.toBeChecked();
  expect(button.getBoundingClientRect().top).toBe(initialTop);
  await screen.unmount();
});

test.each([360, 960])(
  'shows bottom floating actions only after the upper actions leave view at %i px',
  async (width) => {
    const screen = await renderReview({ fullMonths: ['2026-09-01'], edgeMonths: [] }, width);
    await screen.getByRole('button', { name: 'Continue to review' }).click();
    const floating = screen.getByRole('toolbar', { name: 'Import actions while scrolling' });
    await expect.element(floating).not.toBeInTheDocument();
    await screen.getByRole('button', { name: 'Adjust transactions' }).click();
    const container = document.querySelector<HTMLDivElement>('[aria-label="Import review"]')!;
    container.scrollTop = 2000;
    await expect.element(floating).toBeVisible();
    const saveButton = floating.getByRole('button', { name: 'Start import' });
    await expect.element(saveButton).toBeVisible();
    await expect.element(floating.getByText('Step 4 of 5 · Review & save')).toBeVisible();
    await expect.element(floating.getByText(/Test account/)).toBeVisible();
    const bounds = saveButton.element().getBoundingClientRect();
    expect(bounds.bottom).toBeLessThanOrEqual(container.getBoundingClientRect().bottom);
    expect(bounds.top).toBeGreaterThan(container.getBoundingClientRect().top + 100);
    expect(bounds.right).toBeLessThanOrEqual(container.getBoundingClientRect().right);
    container.scrollTop = 0;
    await expect.element(floating).not.toBeInTheDocument();
    await screen.unmount();
  },
);

test('explains why saving is blocked when unreadable rows need acknowledgement', async () => {
  const screen = await renderReview({ fullMonths: ['2026-09-01'], hasHighErrorRate: true });
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeDisabled();
  await expect.element(screen.getByText('Confirm below that you want to skip the unreadable rows.')).toBeVisible();
  await screen.unmount();
});

test('keeps the AI preview out of the review until it is requested', async () => {
  const screen = await renderReview();
  await expect.element(screen.getByText('Preview of texts to send')).not.toBeInTheDocument();
  await screen.getByRole('checkbox', { name: /Import partial month/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await screen.getByRole('button', { name: 'Adjust transactions' }).click();
  await screen.getByRole('button', { name: 'Suggest categories' }).click();
  await expect.element(screen.getByRole('dialog', { name: 'Suggest categories automatically' })).toBeVisible();
  await expect.element(screen.getByText('Preview of texts to send')).toBeVisible();
  await screen.unmount();
});

test('explains optional categorization and labels a manual override of an AI suggestion', async () => {
  const rows = [
    {
      id: 'row',
      bookingDate: '2026-09-15',
      counterparty: 'Merchant',
      amount: 12,
      categoryId: 'food',
      categorySource: 'Ai',
      excluded: false,
      errors: null,
    },
  ] as ImportCandidate[];
  const screen = await renderReview({ fullMonths: ['2026-09-01'] }, 960, 'review', 1, rows);
  await expect.element(screen.getByRole('heading', { name: 'Transactions to import' })).toBeVisible();
  const aiAction = screen.getByRole('region', { name: 'AI category suggestions' });
  await expect.element(aiAction.getByRole('button', { name: 'Suggest categories' })).toBeVisible();
  await expect.element(screen.getByRole('table')).toBeVisible();
  await expect.element(screen.getByText('AI suggestion', { exact: true })).toBeVisible();
  const category = screen.getByRole('combobox', { name: 'Category' });
  const initialRowHeight = category.element().closest('tr')!.getBoundingClientRect().height;
  await category.click();
  await screen.getByRole('option', { name: 'Shopping', exact: true }).click();
  await expect.element(category).toHaveTextContent('Shopping');
  await expect.element(screen.getByText('Manual override', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('AI suggestion', { exact: true })).not.toBeInTheDocument();
  await category.click();
  await screen.getByRole('option', { name: 'Uncategorized', exact: true }).click();
  await expect.element(category).toHaveTextContent('Uncategorized');
  await expect.element(screen.getByText('Manual override', { exact: true })).not.toBeInTheDocument();
  expect(category.element().closest('tr')!.getBoundingClientRect().height).toBe(initialRowHeight);
  await screen.unmount();
});

test('keeps selected months when going back from review', async () => {
  const screen = await renderReview();
  await screen.getByRole('checkbox', { name: /Import partial month/ }).click();
  await screen.getByRole('button', { name: 'Continue to review' }).click();
  await screen.getByRole('button', { name: 'Back', exact: true }).first().click();
  await expect.element(screen.getByRole('checkbox', { name: /Import partial month/ })).toBeChecked();
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
    (button) => button.textContent === 'Start import',
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
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  onTestFinished(() => client.clear());
  const candidate = {
    id: 'row',
    bookingDate: '2026-09-15',
    counterparty: 'Merchant',
    amount: 12,
    errors: null,
    excluded: false,
    categoryId: null,
  } as unknown as ImportCandidate;
  client.setQueryData(queryKeys.categories.list('space'), [{ id: 'food', name: 'Food' }]);
  client.setQueryData(
    importsOptions.candidatesQueryOptions('space', 'import', { months: '2026-09-01', page: 1 }).queryKey,
    candidatePage([candidate]),
  );
  vi.mocked(importsApi.getCandidates).mockResolvedValue(
    candidatePage([{ ...candidate, categoryId: 'food', categorySource: 'Ai' }]),
  );
  const job = {
    id: 'import',
    fullMonths: ['2026-09-01'],
    edgeMonths: [],
    status: 'Categorizing',
    aiCategorizedCount: 0,
  } as unknown as ImportJob;
  client.setQueryData(queryKeys.imports.detail('space', 'import'), job);
  vi.mocked(importsApi.getDetails).mockResolvedValue({ ...job, status: 'NeedsReview', aiCategorizedCount: 1 });
  const screen = await render(
    <QueryClientProvider client={client}>
      <PolledReviewHarness />
    </QueryClientProvider>,
  );
  await screen.getByRole('button', { name: 'Adjust transactions' }).click();
  await expect.element(screen.getByText('Suggesting categories…')).toBeVisible();
  await client.refetchQueries({ queryKey: queryKeys.imports.detail('space', 'import') });
  await expect.element(screen.getByText('AI suggestion')).toBeVisible();
  await expect.element(screen.getByRole('table').getByText('Food', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('1 category suggestions ready. Check the Category column.')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeEnabled();
  await screen.unmount();
});

test.each([360, 960])('keeps the table position stable while AI starts and finishes at %i px', async (width) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  onTestFinished(() => client.clear());
  client.setQueryData(queryKeys.categories.list('space'), []);
  client.setQueryData(
    importsOptions.candidatesQueryOptions('space', 'import', { months: '2026-09-01', page: 1 }).queryKey,
    candidatePage([]),
  );
  vi.mocked(importsApi.getCandidates).mockResolvedValue(candidatePage([]));
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
  await screen.getByRole('button', { name: 'Adjust transactions' }).click();
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
});

test('excluded rows are muted and cannot be categorized until included again', async () => {
  const rows = [
    {
      id: 'row',
      bookingDate: '2026-09-15',
      counterparty: 'Merchant',
      amount: 12,
      categoryId: 'food',
      categorySource: 'Manual',
      excluded: true,
      errors: null,
    },
  ] as ImportCandidate[];
  const screen = await renderReview({ fullMonths: ['2026-09-01'] }, 360, 'review', 1, rows);
  const category = screen.getByRole('combobox', { name: 'Category' });
  await expect.element(category).toBeDisabled();
  await expect.element(screen.getByText('Not imported', { exact: true })).toBeVisible();
  expect(category.element().closest('tr')?.getAttribute('data-excluded')).toBe('true');
  const checkbox = screen.getByRole('checkbox', { name: 'Import this row' });
  await expect.element(checkbox).toBeEnabled();
  await checkbox.click();
  await expect.element(category).toBeEnabled();
  await expect.element(checkbox).toBeChecked();
  await screen.unmount();
});

test('reset clears manual overrides on every page and preserves automatic categories and exclusions', async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `row-${index}`,
    bookingDate: '2026-09-15',
    counterparty: `Merchant ${index + 1}`,
    amount: 12,
    categoryId: 'food',
    categorySource: index === 1 ? 'Ai' : 'Manual',
    excluded: index === 100,
    errors: null,
  })) as ImportCandidate[];
  const screen = await renderReview({ fullMonths: ['2026-09-01'] }, 960, 'review', 101, rows);
  await screen.getByRole('button', { name: 'Reset overrides' }).click();
  await vi.waitFor(() => expect(importsApi.resetOverrides).toHaveBeenCalledWith('space', 'import'));
  await expect.element(screen.getByRole('combobox', { name: 'Category' }).first()).toHaveTextContent('Uncategorized');
  expect(rows[1].categorySource).toBe('Ai');
  expect(rows[1].categoryId).toBe('food');
  await screen.getByRole('button', { name: 'Next rows' }).click();
  await expect.element(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Uncategorized');
  await expect.element(screen.getByRole('checkbox', { name: 'Import this row' })).not.toBeChecked();
  await screen.unmount();
});

test.each([360, 960])(
  'groups optional adjustments behind one disclosure and keeps import context with save at %i px',
  async (width) => {
    const screen = await renderReview(
      { fullMonths: ['2026-09-01'], edgeMonths: [] },
      width,
      'review',
      120,
      undefined,
      false,
    );
    const toggle = screen.getByRole('button', { name: 'Adjust transactions' });
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Suggest categories' })).not.toBeInTheDocument();
    const navigation = document.querySelector<HTMLElement>('[aria-label="Import actions"]')!;
    expect(navigation.textContent).toContain('Test account');
    expect(navigation.querySelectorAll('button')).toHaveLength(2);
    expect(navigation.scrollWidth).toBeLessThanOrEqual(navigation.clientWidth);
    await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeEnabled();
    await document.fonts.ready;
    const toggleWidth = toggle.element().getBoundingClientRect().width;
    await toggle.click();
    expect(screen.getByRole('button', { name: 'Hide transactions' }).element().getBoundingClientRect().width).toBe(
      toggleWidth,
    );
    await expect.element(screen.getByRole('button', { name: 'Suggest categories' })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Category' }).first()).toBeVisible();
    await expect.element(screen.getByRole('tab')).not.toBeInTheDocument();
    await screen.getByRole('button', { name: 'Hide transactions' }).click();
    await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Start import' }).first()).toBeEnabled();
    await screen.unmount();
  },
);

test('stepper circles stay below the app header when scrolling', async () => {
  const screen = await render(
    <div aria-label='Scroll frame' style={{ height: 200, overflow: 'auto', width: '100%', maxWidth: 600 }}>
      <header className='bg-background sticky top-0 z-10 h-12' aria-label='App header'>
        Import
      </header>
      <div style={{ height: 800 }}>
        <ImportSteps currentStep={3} />
      </div>
    </div>,
  );
  const frame = screen.getByLabelText('Scroll frame').element();
  frame.scrollTop = 20;
  await expect.poll(() => frame.scrollTop).toBe(20);
  const circle = frame.querySelector<HTMLElement>('[aria-current="step"] > span.relative')!;
  const bounds = circle.getBoundingClientRect();
  const header = screen.getByRole('banner', { name: 'App header' }).element();
  const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + 5);
  expect(header.contains(hit)).toBe(true);
  await screen.unmount();
});
