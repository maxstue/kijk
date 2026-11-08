import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import { Calendar } from './calendar';

test('moves keyboard focus between calendar days', async () => {
  const screen = await render(<Calendar mode='single' defaultMonth={new Date(2026, 5, 1)} />);
  try {
    const firstDay = screen.getByRole('button', { name: /^Monday, June 1st, 2026/ });
    const nextDay = screen.getByRole('button', { name: /^Tuesday, June 2nd, 2026/ });
    await firstDay.click();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(nextDay).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(firstDay).toHaveFocus();
  } finally {
    await screen.unmount();
  }
});
