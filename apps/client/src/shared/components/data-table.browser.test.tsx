import type { ListQuery } from '@kijk/api/paging';
import { QueryClient, QueryClientProvider, queryOptions } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import type { DataTableFeatures } from '@/shared/lib/table-features';
import type { TableState } from '@/shared/lib/table-query';
import type { TableSort } from '@/shared/lib/table-query';

import { DataTable } from './data-table';

interface Item {
  name: string;
  amount: number;
}

type ItemSort = 'Name' | 'Amount';

const columns: Array<ColumnDef<DataTableFeatures, Item>> = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
      </button>
    ),
  },
  { accessorKey: 'amount', header: 'Amount' },
];

const sort: TableSort<ItemSort> = {
  columns: { amount: 'Amount', name: 'Name' },
  defaultSort: { desc: true, id: 'name' },
};

const items: Item[] = Array.from({ length: 12 }, (_, index) => ({
  amount: index,
  name: `Item ${String(index + 1).padStart(2, '0')}`,
}));

/** Answers like the API: searches, sorts, pages and clamps a page past the end to the last page. */
function fakeApi(query: ListQuery<ItemSort>) {
  const pageSize = query.pageSize ?? items.length;
  const matching = items
    .filter((item) => !query.search || item.name.toLowerCase().includes(query.search.toLowerCase()))
    .toSorted((left, right) => left.name.localeCompare(right.name) * (query.descending ? -1 : 1));
  const lastPage = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(query.page ?? 1, lastPage);
  const start = (page - 1) * pageSize;
  return Promise.resolve({ items: matching.slice(start, start + pageSize), page, totalCount: matching.length });
}

function renderTable(api = vi.fn<typeof fakeApi>(fakeApi)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const screen = render(
    <QueryClientProvider client={client}>
      <TestTable api={api} />
    </QueryClientProvider>,
  );
  return { api, client, screen };
}

interface Props {
  api: typeof fakeApi;
}
function TestTable({ api }: Props) {
  const [state, onStateChange] = useState<TableState>({});
  return (
    <DataTable
      state={state}
      onStateChange={onStateChange}
      columns={columns}
      queryOptions={(query) => queryOptions({ queryFn: () => api(query), queryKey: ['items', query] })}
      searchPlaceholder='Search name...'
      sort={sort}
    />
  );
}

function renderedNames(container: HTMLElement) {
  return [...container.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent);
}

test('requests the first page with the default sort and pages on the server', async () => {
  const { api, screen } = renderTable();
  const rendered = await screen;

  await expect.poll(() => renderedNames(rendered.container)).toHaveLength(10);
  expect(renderedNames(rendered.container)[0]).toBe('Item 12');
  expect(api).toHaveBeenCalledWith({ descending: true, page: 1, pageSize: 10, search: undefined, sort: 'Name' });

  await rendered.getByRole('button', { name: 'Next' }).click();

  await expect.poll(() => renderedNames(rendered.container)).toEqual(['Item 02', 'Item 01']);
  expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
});

test('sorts on the server from the column header and starts at the first page again', async () => {
  const { api, screen } = renderTable();
  const rendered = await screen;
  await rendered.getByRole('button', { name: 'Next' }).click();
  await expect.poll(() => renderedNames(rendered.container)).toEqual(['Item 02', 'Item 01']);

  await rendered.getByRole('button', { name: 'Name' }).click();

  await expect.poll(() => renderedNames(rendered.container)[0]).toBe('Item 01');
  expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ descending: false, page: 1, sort: 'Name' }));
});

test('searches on the server together with sort and page, starting at the first page', async () => {
  const { api, screen } = renderTable();
  const rendered = await screen;
  await rendered.getByRole('button', { name: 'Next' }).click();
  await expect.poll(() => renderedNames(rendered.container)).toEqual(['Item 02', 'Item 01']);

  await rendered.getByRole('searchbox', { name: 'Search name...' }).fill('item 1');
  await rendered.getByRole('button', { name: 'Search' }).click();

  await expect.poll(() => renderedNames(rendered.container)).toEqual(['Item 12', 'Item 11', 'Item 10']);
  expect(api).toHaveBeenLastCalledWith({ descending: true, page: 1, pageSize: 10, search: 'item 1', sort: 'Name' });
});

test('follows the API to the last page when the requested one no longer exists', async () => {
  let shrunk = false;
  const api = vi.fn<typeof fakeApi>((query) =>
    fakeApi(shrunk ? { ...query, search: query.search ?? 'item 0' } : query),
  );
  const { client, screen } = renderTable(api);
  const rendered = await screen;
  await rendered.getByRole('button', { name: 'Next' }).click();
  await expect.poll(() => renderedNames(rendered.container)).toEqual(['Item 02', 'Item 01']);

  // The rows of page 2 are deleted; the refetch answers with the new last page.
  shrunk = true;
  await client.invalidateQueries();

  await expect.poll(() => renderedNames(rendered.container)).toHaveLength(9);
  await expect.element(rendered.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
});

test('offers a retry when the page cannot be loaded', async () => {
  const api = vi.fn<typeof fakeApi>().mockRejectedValue(new Error('offline'));
  const { screen } = renderTable(api);
  const rendered = await screen;

  await expect.element(rendered.getByText('The rows could not be loaded.')).toBeVisible();
  api.mockImplementation(fakeApi);
  await rendered.getByRole('button', { name: 'Try again' }).click();

  await expect.poll(() => renderedNames(rendered.container)).toHaveLength(10);
  expect(renderedNames(rendered.container)).toHaveLength(10);
});

test('shows a refresh failure and retry alongside cached rows', async () => {
  const { api, client, screen } = renderTable();
  const rendered = await screen;
  await expect.poll(() => renderedNames(rendered.container)).toHaveLength(10);
  api.mockRejectedValueOnce(new Error('offline'));
  await client.invalidateQueries();
  await expect.element(rendered.getByRole('alert')).toBeVisible();
  await expect.element(rendered.getByText('The rows could not be loaded.')).toBeVisible();
  expect(renderedNames(rendered.container)).toHaveLength(10);
  await rendered.getByRole('button', { name: 'Try again' }).click();
  await expect.element(rendered.getByRole('alert')).not.toBeInTheDocument();
  expect(renderedNames(rendered.container)).toHaveLength(10);
});
