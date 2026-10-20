import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { HomeChartArea } from './home-chart-area';

test('updates the area chart time range and shows individual values rather than stacked totals', async () => {
  const screen = await render(
    <div style={{ width: 900 }}>
      <HomeChartArea />
    </div>,
  );
  const chart = screen.getByRole('img', { name: 'Desktop and mobile usage over time' });
  await expect.element(chart).toBeVisible();
  expect(chart.element().querySelectorAll('.ts-chart__area path')).toHaveLength(2);

  await screen.getByRole('button', { name: 'Last 7 days', exact: true }).click();
  await chart.click();
  await userEvent.keyboard('{Home}');
  const tooltip = screen.getByRole('status');
  await expect.element(tooltip.getByText('Jun 23', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('Mobile', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('530', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('Desktop', { exact: true })).toBeVisible();
  await expect.element(tooltip.getByText('480', { exact: true })).toBeVisible();

  await userEvent.keyboard('{Escape}');
  await screen.getByRole('button', { name: 'Last 30 days', exact: true }).click();
  await chart.click();
  await userEvent.keyboard('{Home}');
  await expect.element(tooltip.getByText('May 31', { exact: true })).toBeVisible();
  await screen.unmount();
});

test('the compact time-range select updates the displayed chart', async () => {
  const screen = await render(
    <div style={{ width: 360 }}>
      <HomeChartArea />
    </div>,
  );

  await screen.getByRole('combobox').click();
  await screen.getByRole('option', { name: 'Last 7 days', exact: true }).click();
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Last 7 days');
  await screen.getByRole('img', { name: 'Desktop and mobile usage over time' }).click();
  await userEvent.keyboard('{Home}');
  await expect.element(screen.getByRole('status').getByText('Jun 23', { exact: true })).toBeVisible();
  await screen.unmount();
});
