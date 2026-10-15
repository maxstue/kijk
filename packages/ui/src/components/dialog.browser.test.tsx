import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';

test('opens an accessible dialog and returns focus to its trigger when closed', async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Review transaction</DialogTrigger>
      <DialogContent>
        <DialogTitle>Transaction details</DialogTitle>
        <DialogDescription>Check the transaction before saving.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
  const trigger = screen.getByRole('button', { name: 'Review transaction' });
  await trigger.click();
  const dialog = screen.getByRole('dialog', { name: 'Transaction details' });
  await expect.element(dialog).toBeVisible();
  await expect.element(dialog).toHaveAccessibleDescription('Check the transaction before saving.');
  await screen.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.element(dialog).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});
