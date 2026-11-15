import type { ImportsQuery } from '@kijk/api/imports/types';
import { queryKeys } from '@kijk/api/query-keys';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';

import { listPage } from '@/test/list-page';
import { worker } from '@/test/mocks/browser';
import { render } from '@/test/render-space';

import { ImportList } from './import-list';

test('keeps account, status and sort filters when paging and resets the page on search', async () => {
  const requests: URLSearchParams[] = [];
  worker.use(
    http.get('http://localhost:5000/api/spaces/space/imports', ({ request }) => {
      const query = new URL(request.url).searchParams;
      requests.push(query);
      const current = Number(query.get('page'));
      return HttpResponse.json({
        items: [
          {
            id: `job-${current}`,
            fileName: `Statement page ${current}`,
            accountName: 'Checking',
            createdAt: '2026-11-01T12:00:00Z',
            status: 'Done',
            importedCount: 10,
          },
        ],
        page: current,
        pageSize: 10,
        totalCount: 35,
      });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(queryKeys.accounts.list('space'), listPage([{ id: 'account', name: 'Checking' }]));
  const screen = await render(
    <QueryClientProvider client={client}>
      <TestList />
    </QueryClientProvider>,
  );
  await expect.element(screen.getByText('Statement page 2')).toBeVisible();
  await screen.getByRole('button', { name: 'Next', exact: true }).click();
  await expect.element(screen.getByText('Statement page 3')).toBeVisible();
  expect(requests.at(-1)?.get('status')).toBe('Done');
  expect(requests.at(-1)?.get('accountId')).toBe('account');
  expect(requests.at(-1)?.get('descending')).toBe('true');
  await screen.getByRole('searchbox', { name: 'Search imports' }).fill('bank');
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByText('Statement page 1')).toBeVisible();
  expect(requests.at(-1)?.get('search')).toBe('bank');
  expect(requests.at(-1)?.get('status')).toBe('Done');
  expect(requests.at(-1)?.get('accountId')).toBe('account');
  await screen.unmount();
  client.clear();
});

function TestList() {
  const [query, setQuery] = useState<ImportsQuery>({
    page: 2,
    pageSize: 10,
    search: '',
    status: 'Done',
    accountId: 'account',
    sort: 'CreatedAt',
    descending: true,
  });
  return <ImportList query={query} onQueryChange={setQuery} />;
}
