import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ResourceIconPicker } from './icon-picker';

test('searches the complete Lucide catalog and selects an icon', async () => {
  const onChange = vi.fn<(value: string) => void>();
  const screen = await render(<ResourceIconPicker value='circle' onChange={onChange} />);

  await screen.getByRole('button', { name: /Circle/ }).click();
  await expect.element(screen.getByRole('option', { name: 'A Arrow Down' })).toBeVisible();

  const iconList = screen.getByRole('listbox');
  await expect.poll(async () => {
    const element = await iconList.element();
    return element.scrollHeight > element.clientHeight;
  }).toBe(true);

  await screen.getByPlaceholder('Search Lucide icons…').fill('zodiac-taurus');
  await expect.element(screen.getByRole('option', { name: 'Zodiac Taurus' })).toBeVisible();

  await screen.getByRole('option', { name: 'Zodiac Taurus' }).click();
  expect(onChange).toHaveBeenCalledWith('zodiac-taurus');
});
