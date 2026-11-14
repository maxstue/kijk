import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

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

test('closes from the footer when the header close button is hidden', async () => {
  const screen = await render(
    <Dialog>
      <DialogTrigger>Review budget</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Budget details</DialogTitle>
          <DialogDescription>Review your budget before saving.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>,
  );
  const trigger = screen.getByRole('button', { name: 'Review budget' });
  await trigger.click();
  const dialog = screen.getByRole('dialog', { name: 'Budget details' });
  await expect.element(dialog).toHaveAccessibleDescription('Review your budget before saving.');
  await expect.element(screen.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.element(dialog).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});
