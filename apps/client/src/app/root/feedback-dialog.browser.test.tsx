import { Dialog } from '@kijk/ui/components/dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HttpResponse, http } from 'msw';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { worker } from '@/test/mocks/browser';

import { FeedbackDialog } from './feedback-dialog';

test('retains failed feedback and closes only after the API accepts a retry', async () => {
  let accepted = false;
  const messages: unknown[] = [];
  worker.use(
    http.post('*/api/users/me/feedback', async ({ request }) => {
      messages.push(await request.json());
      return accepted
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ title: 'Unavailable' }, { status: 503 });
    }),
  );
  const onClose = vi.fn<() => void>();
  const client = new QueryClient();
  const screen = await render(
    <QueryClientProvider client={client}>
      <Dialog open>
        <FeedbackDialog onClose={onClose} />
      </Dialog>
    </QueryClientProvider>,
  );
  try {
    await expect.element(screen.getByText(/independently of your analytics settings/)).toBeVisible();
    await screen.getByRole('textbox', { name: 'Message' }).fill('Please improve the overview');
    await screen.getByRole('button', { name: 'Send', exact: true }).click();
    await expect.poll(() => messages.length).toBe(1);
    await expect.element(screen.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
    await expect.element(screen.getByRole('textbox')).toHaveValue('Please improve the overview');
    expect(onClose).not.toHaveBeenCalled();

    accepted = true;
    await screen.getByRole('button', { name: 'Send', exact: true }).click();
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(messages).toEqual([{ message: 'Please improve the overview' }, { message: 'Please improve the overview' }]);
  } finally {
    await screen.unmount();
    client.clear();
  }
});
