import { expect, test } from 'vite-plus/test';

import { tablePageSize, toTableQuery, fromTableSearch, toTableSearch, tableSearchSchema } from './table-query';

const sort = { columns: { name: 'Name', type: 'Kind' } as const, defaultSort: { desc: false, id: 'name' } };

test('builds the first page with the default sort and no search', () => {
  expect(toTableQuery(sort)).toEqual({
    descending: false,
    page: 1,
    pageSize: tablePageSize,
    search: undefined,
    sort: 'Name',
  });
});

test('maps the sorted column, the page index and the search', () => {
  expect(toTableQuery(sort, { pageIndex: 2, search: 'gas', sort: { desc: true, id: 'type' } })).toEqual({
    descending: true,
    page: 3,
    pageSize: tablePageSize,
    search: 'gas',
    sort: 'Kind',
  });
});

test('round-trips table URL state and falls back from unsupported sort columns', () => {
  const state = fromTableSearch(sort, { page: 3, search: 'gas', sort: 'type', descending: true });
  expect(toTableQuery(sort, state)).toMatchObject({ page: 3, search: 'gas', sort: 'Kind', descending: true });
  expect(toTableSearch(state)).toEqual({ page: 3, search: 'gas', sort: 'type', descending: true });
  expect(fromTableSearch(sort, { sort: 'toString' }).sort).toEqual(sort.defaultSort);
  expect(tableSearchSchema.parse({ page: -1, descending: 'false', search: 42 })).toMatchObject({
    page: 1,
    search: '',
    descending: undefined,
  });
});
