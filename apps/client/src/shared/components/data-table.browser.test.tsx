import type { ColumnDef } from '@tanstack/react-table';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import type { DataTableFeatures } from '@/shared/lib/table-features';

import { DataTable } from './data-table';

interface Item {
  name: string;
  amount: number;
}

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

const items: Item[] = Array.from({ length: 12 }, (_, index) => ({
  amount: index,
  name: `Item ${String(index + 1).padStart(2, '0')}`,
}));

function renderedNames(container: HTMLElement) {
  return [...container.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent);
}

test('sorts by the default sort and paginates ten rows per page', async () => {
  const screen = await render(<DataTable columns={columns} data={items} defaultSort={{ desc: true, id: 'name' }} />);

  const names = renderedNames(screen.container);
  expect(names).toHaveLength(10);
  expect(names[0]).toBe('Item 12');

  await screen.getByRole('button', { name: 'Next' }).click();
  expect(renderedNames(screen.container)).toEqual(['Item 02', 'Item 01']);
});

test('toggles sorting from the column header', async () => {
  const screen = await render(<DataTable columns={columns} data={items} defaultSort={{ desc: true, id: 'name' }} />);

  await screen.getByRole('button', { name: 'Name' }).click();

  expect(renderedNames(screen.container)[0]).toBe('Item 01');
});

test('filters rows by name', async () => {
  const screen = await render(<DataTable columns={columns} data={items} />);

  await screen.getByPlaceholder('Filter name...').fill('item 1');

  expect(renderedNames(screen.container)).toEqual(['Item 10', 'Item 11', 'Item 12']);
});
