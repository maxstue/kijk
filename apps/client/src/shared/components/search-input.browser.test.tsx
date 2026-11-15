import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import { SearchInput } from './search-input';

test('applies the trimmed search once typing pauses', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' onSearch={onSearch} />);

  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('  check ');

  expect(onSearch).not.toHaveBeenCalled();
  await expect.poll(() => onSearch.mock.calls).toEqual([['check']]);
});

test('applies the search immediately on Enter without a second debounced search', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' onSearch={onSearch} />);

  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('check');
  await userEvent.keyboard('{Enter}');

  expect(onSearch.mock.calls).toEqual([['check']]);
  await new Promise((resolve) => setTimeout(resolve, 700));
  expect(onSearch.mock.calls).toEqual([['check']]);
});

test('applies the search immediately with the search button', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' onSearch={onSearch} />);

  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('check');
  await screen.getByRole('button', { name: 'Search' }).click();

  expect(onSearch.mock.calls).toEqual([['check']]);
});

test('does not apply the same search twice', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' onSearch={onSearch} />);

  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('check');
  await expect.poll(() => onSearch.mock.calls).toEqual([['check']]);
  await userEvent.keyboard('{Enter}');
  await screen.getByRole('button', { name: 'Search' }).click();

  expect(onSearch.mock.calls).toEqual([['check']]);
});

test('shows an applied search that changes from outside', async () => {
  const screen = await render(<SearchInput aria-label='Search accounts' value='check' onSearch={() => {}} />);
  await expect.element(screen.getByRole('searchbox', { name: 'Search accounts' })).toHaveValue('check');

  await screen.rerender(<SearchInput aria-label='Search accounts' value='' onSearch={() => {}} />);

  await expect.element(screen.getByRole('searchbox', { name: 'Search accounts' })).toHaveValue('');
});

test('keeps the draft while URL navigation is pending and preserves newer typing on acknowledgement', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' value='old' onSearch={onSearch} />);
  const input = screen.getByRole('searchbox', { name: 'Search accounts' });
  await input.fill('new');
  await userEvent.keyboard('{Enter}');
  await expect.element(input).toHaveValue('new');
  await input.fill('newer');
  await screen.rerender(<SearchInput aria-label='Search accounts' value='new' onSearch={onSearch} />);
  await expect.element(input).toHaveValue('newer');
  await expect.poll(() => onSearch.mock.calls).toEqual([['new'], ['newer']]);
});

test('abandons a pending draft when the URL changes externally', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' value='old' onSearch={onSearch} />);
  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('abandoned');
  await screen.rerender(<SearchInput aria-label='Search accounts' value='restored' onSearch={onSearch} />);
  await expect.element(screen.getByRole('searchbox', { name: 'Search accounts' })).toHaveValue('restored');
  await new Promise((resolve) => setTimeout(resolve, 700));
  expect(onSearch).not.toHaveBeenCalled();
});

test('cancels pending searches when the field unmounts', async () => {
  const onSearch = vi.fn<(search: string) => void>();
  const screen = await render(<SearchInput aria-label='Search accounts' onSearch={onSearch} />);
  await screen.getByRole('searchbox', { name: 'Search accounts' }).fill('abandoned');
  await screen.unmount();
  await new Promise((resolve) => setTimeout(resolve, 700));
  expect(onSearch).not.toHaveBeenCalled();
});
