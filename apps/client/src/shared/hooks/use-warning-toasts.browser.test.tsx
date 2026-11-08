import { toast } from 'sonner';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { useWarningToasts, type WarningToast } from './use-warning-toasts';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn<(title: string, options: { id: string; description: string }) => void>(),
    dismiss: vi.fn<(id: string) => void>(),
  },
}));

function Warnings({ warnings }: { warnings: WarningToast[] }) {
  useWarningToasts(warnings);
  return null;
}

const warning: WarningToast = {
  id: 'water-limit',
  active: true,
  title: 'Water limit exceeded',
  description: 'Consumption is above the limit.',
};

test('does not reopen unchanged warnings on rerender and updates changed warning content', async () => {
  const screen = await render(<Warnings warnings={[warning]} />);
  try {
    expect(toast.warning).toHaveBeenCalledTimes(1);
    await screen.rerender(<Warnings warnings={[{ ...warning }]} />);
    expect(toast.warning).toHaveBeenCalledTimes(1);

    await screen.rerender(<Warnings warnings={[{ ...warning, description: 'Consumption increased further.' }]} />);
    expect(toast.warning).toHaveBeenCalledTimes(2);
    expect(toast.warning).toHaveBeenLastCalledWith(
      warning.title,
      expect.objectContaining({ id: warning.id, description: 'Consumption increased further.' }),
    );
  } finally {
    await screen.unmount();
  }
});

test.each(['resolved', 'removed'] as const)('dismisses a warning when it is %s', async (change) => {
  const screen = await render(<Warnings warnings={[warning]} />);
  try {
    await screen.rerender(<Warnings warnings={change === 'removed' ? [] : [{ ...warning, active: false }]} />);
    expect(toast.dismiss).toHaveBeenCalledWith(warning.id);
  } finally {
    await screen.unmount();
  }
});
