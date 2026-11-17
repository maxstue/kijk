import { expect, test } from 'vite-plus/test';

import { tablePageSize, tableSearchDefaults, tableSearchSchema, toColumnSort, toTableQuery } from './table-query';

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

test('maps the URL page, search and sorted column', () => {
  expect(toTableQuery(sort, { page: 3, search: 'gas', sort: 'type', descending: true })).toEqual({
    descending: true,
    page: 3,
    pageSize: tablePageSize,
    search: 'gas',
    sort: 'Kind',
  });
});

test('falls back from unsupported sort columns and invalid URL values', () => {
  expect(toColumnSort(sort, { sort: 'toString' })).toEqual(sort.defaultSort);
  expect(tableSearchSchema.parse({ page: -1, descending: 'false', search: 42 })).toMatchObject({
    page: 1,
    search: '',
    descending: undefined,
  });
});

test('derives the URL defaults from the initial sort', () => {
  expect(tableSearchDefaults(sort)).toEqual({ page: 1, search: '', sort: 'name', descending: false });
});
