import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@kijk/ui/components/dialog';
import { Suspense, use } from 'react';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { PageAddButton } from './page-header';

function DeferredDialogContent({ data }: { data: Promise<string> }) {
  const value = use(data);
  return (
    <>
      <DialogTitle>Add item</DialogTitle>
      <DialogDescription>{value}</DialogDescription>
    </>
  );
}

test('a cold dialog loads in its modal and keeps the background layout mounted', async () => {
  let resolveData!: (value: string) => void;
  const data = new Promise<string>((resolve) => {
    resolveData = resolve;
  });
  const screen = await render(
    <Suspense fallback={<p>Page loading</p>}>
      <div id='dialog-background' style={{ minHeight: 300 }}>
        <h1>Existing page</h1>
        <Dialog>
          <DialogTrigger asChild>
            <PageAddButton>Add item</PageAddButton>
          </DialogTrigger>
          <DialogContent>
            <DeferredDialogContent data={data} />
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>,
  );
  const before = document.querySelector('#dialog-background')!.getBoundingClientRect();

  await screen.getByRole('button', { name: 'Add item' }).click();
  const dialog = screen.getByRole('dialog');
  await expect.element(dialog.getByRole('status')).toHaveTextContent('Loading dialog content');
  await expect.element(screen.getByText('Page loading')).not.toBeInTheDocument();
  expect(document.querySelector('#dialog-background h1')?.textContent).toBe('Existing page');
  const during = document.querySelector('#dialog-background')!.getBoundingClientRect();
  expect(during.top).toBe(before.top);
  expect(during.height).toBe(before.height);

  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Add item' }).click();
  resolveData('Form ready');
  await expect.element(screen.getByRole('dialog').getByText('Form ready')).toBeVisible();
  await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
  await screen.unmount();
});
