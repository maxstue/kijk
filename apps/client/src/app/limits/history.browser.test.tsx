import type { Limit } from '@kijk/api/limits/types';
import { Dialog } from '@kijk/ui/components/dialog';
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import { LimitHistoryContent } from './history';

const limit: Limit = {
  id: 'limit',
  name: 'Electricity',
  description: null,
  period: 'Month',
  active: true,
  resource: { id: 'resource', name: 'Electricity', unit: 'kWh', color: '#123456' },
  actualValue: 120,
  limit: 100,
  utilizationPercentage: 120,
  remainingValue: 0,
  isExceeded: true,
  periodStart: '2026-11-01T00:00:00Z',
  periodEnd: '2026-12-01T00:00:00Z',
  lastOccurrence: null,
  history: Array.from({ length: 48 }, (_, index) => ({
    periodStart: new Date(Date.UTC(2026, 10 - index, 1)).toISOString(),
    periodEnd: new Date(Date.UTC(2026, 11 - index, 1)).toISOString(),
    actualValue: 120,
    isExceeded: true,
    isComplete: index > 0,
  })),
};

test.each([
  { width: 320, height: 568, dialogHeight: 552 },
  { width: 375, height: 812, dialogHeight: 796 },
  { width: 667, height: 375, dialogHeight: 343 },
  { width: 768, height: 1024, dialogHeight: 576 },
  { width: 1280, height: 800, dialogHeight: 640 },
])('keeps only the long history scrolling at $width × $height', async ({ width, height, dialogHeight }) => {
  await page.viewport(width, height);
  const screen = await render(
    <Dialog open>
      <LimitHistoryContent limit={limit} />
    </Dialog>,
  );
  const dialog = screen.getByRole('dialog');
  const list = screen.getByRole('list', { name: 'Recorded periods' });
  const heading = screen.getByRole('heading', { name: 'Electricity history' });

  await expect.element(dialog).toBeVisible();
  await expect.poll(() => Math.round(dialog.element().getBoundingClientRect().height)).toBe(dialogHeight);
  const bounds = dialog.element().getBoundingClientRect();
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(height);
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(width);
  expect(dialog.element().scrollHeight).toBeLessThanOrEqual(dialog.element().clientHeight);
  expect(list.element().scrollHeight).toBeGreaterThan(list.element().clientHeight);
  const headingTop = heading.element().getBoundingClientRect().top;
  list.element().scrollTop = list.element().scrollHeight;
  await expect.poll(() => list.element().scrollTop).toBeGreaterThan(0);
  expect(heading.element().getBoundingClientRect().top).toBe(headingTop);
  expect(dialog.element().scrollTop).toBe(0);
  await expect.element(screen.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await screen.unmount();
});
