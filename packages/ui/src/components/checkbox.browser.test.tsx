import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { Checkbox } from './checkbox';

test('toggles a labeled checkbox and reports both changes', async () => {
  const onCheckedChange = vi.fn<(checked: boolean) => void>();
  const screen = await render(<Checkbox aria-label='Include transaction' onCheckedChange={onCheckedChange} />);
  const checkbox = screen.getByRole('checkbox', { name: 'Include transaction' });
  await expect.element(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect.element(checkbox).toBeChecked();
  expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
  await checkbox.click();
  await expect.element(checkbox).not.toBeChecked();
  expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.anything());
});

test('exposes a disabled checkbox without allowing changes', async () => {
  const onCheckedChange = vi.fn<(checked: boolean) => void>();
  const screen = await render(
    <Checkbox aria-label='Locked transaction' disabled checked onCheckedChange={onCheckedChange} />,
  );
  const checkbox = screen.getByRole('checkbox', { name: 'Locked transaction' });
  await expect.element(checkbox).toBeDisabled();
  await expect.element(checkbox).toBeChecked();
  expect(onCheckedChange).not.toHaveBeenCalled();
});
