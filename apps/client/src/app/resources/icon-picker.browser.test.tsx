import { Dialog, DialogContent, DialogTitle } from '@kijk/ui/components/dialog';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { ResourceIconPicker } from './icon-picker';

test('searches the complete Lucide catalog and selects an icon', async () => {
  const onChange = vi.fn<(value: string) => void>();
  const screen = await render(<ResourceIconPicker value='circle' onChange={onChange} />);

  await screen.getByRole('button', { name: /Circle/ }).click();
  await expect.element(screen.getByRole('option', { name: 'A Arrow Down' })).toBeVisible();

  const iconList = screen.getByRole('listbox');
  await expect
    .poll(async () => {
      const element = iconList.element();
      return element.scrollHeight > element.clientHeight;
    })
    .toBe(true);

  await screen.getByPlaceholder('Search Lucide icons…').fill('zodiac-taurus');
  await expect.element(screen.getByRole('option', { name: 'Zodiac Taurus' })).toBeVisible();

  await screen.getByRole('option', { name: 'Zodiac Taurus' }).click();
  expect(onChange).toHaveBeenCalledWith('zodiac-taurus');
});

test('renders the scrollable icon list inside its parent dialog', async () => {
  const screen = await render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Choose an icon</DialogTitle>
        <ResourceIconPicker value='circle' onChange={vi.fn<(value: string) => void>()} />
      </DialogContent>
    </Dialog>,
  );

  await screen.getByRole('button', { name: /Circle/ }).click();
  const iconList = screen.getByRole('listbox').element();
  const dialogContent = iconList.closest<HTMLElement>('[data-slot="dialog-content"]');
  expect(dialogContent).not.toBeNull();
  expect(window.getComputedStyle(dialogContent!).overflowY).toBe('visible');
});
