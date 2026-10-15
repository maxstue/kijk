import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import type { Consumption } from '@/shared/types/domain';

import { ConsumptionAnnualView } from './annual-view';

vi.mock('./edit-button', () => ({
  ConsumptionEditButton: ({ id }: { id: string }) => <button aria-label={`Edit ${id}`}>Edit</button>,
}));
vi.mock('./delete-button', () => ({
  ConsumptionDeleteButton: ({ id }: { id: string }) => <button aria-label={`Delete ${id}`}>Delete</button>,
}));
vi.mock('./limit-warning', () => ({ LimitWarning: () => null }));

const electricity: Consumption['resource'] = {
  id: 'electricity',
  name: 'Electricity',
  icon: 'zap',
  color: '#f59e0b',
  unit: 'kWh',
};
const water: Consumption['resource'] = { id: 'water', name: 'Water', icon: 'droplets', color: '#3b82f6', unit: 'l' };

function entry(id: string, resource: Consumption['resource'], date: string, value: number, reset = false): Consumption {
  return {
    id,
    resource,
    date,
    value,
    name: id,
    description: null,
    startsNewMeterSegment: reset,
    calculatedConsumption: reset ? 0 : value,
    valueType: 'Relative',
  };
}

test('shows an explicit empty state when the year has no consumptions', async () => {
  const screen = await render(<ConsumptionAnnualView consumptions={[]} />);
  await expect.element(screen.getByText('No consumptions found.')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Expand entries' })).not.toBeInTheDocument();
});

test('expands grouped readings in date order and distinguishes meter resets', async () => {
  const screen = await render(
    <ConsumptionAnnualView
      consumptions={[
        entry('January reading', electricity, '2026-01-01', 30),
        entry('New meter', electricity, '2026-02-01', 100, true),
        entry('March reading', electricity, '2026-03-01', 20),
      ]}
    />,
  );
  await expect.element(screen.getByText('3 entries')).toBeVisible();
  await expect.element(screen.getByText('January reading')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Expand entries' }).click();
  await expect.element(screen.getByText('Reset', { exact: true })).toBeVisible();
  await expect.element(screen.getByText('—', { exact: true })).toBeVisible();
  const names = screen.getByRole('cell', { name: /^(March reading|New meter|January reading)( Reset)?$/ });
  await expect.poll(() => names.all().length).toBe(3);
  for (const [index, name] of ['March reading', 'New meter Reset', 'January reading'].entries()) {
    await expect.element(names.nth(index)).toHaveTextContent(name);
  }
  await expect.element(screen.getByRole('button', { name: 'Edit March reading' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Delete March reading' })).toBeVisible();
  await screen.getByRole('button', { name: 'Collapse entries' }).click();
  await expect.element(screen.getByText('January reading')).not.toBeInTheDocument();
});

test('filters summaries by resource and can return to all types', async () => {
  const screen = await render(
    <ConsumptionAnnualView
      consumptions={[entry('Meter', electricity, '2026-01-01', 30), entry('Water reading', water, '2026-01-02', 20)]}
    />,
  );
  const filter = screen.getByRole('combobox', { name: 'Filter consumptions by type' });
  await filter.click();
  await screen.getByRole('option', { name: 'Water' }).click();
  await expect.element(filter).toHaveTextContent('Water');
  await expect.poll(() => screen.getByRole('button', { name: 'Expand entries' }).all().length).toBe(1);
  await expect.element(screen.getByText('Electricity', { exact: true })).not.toBeInTheDocument();
  await expect.element(screen.getByText('1 entry').first()).toBeVisible();
  await filter.click();
  await screen.getByRole('option', { name: 'All types' }).click();
  await expect.poll(() => screen.getByRole('button', { name: 'Expand entries' }).all().length).toBe(2);
});
