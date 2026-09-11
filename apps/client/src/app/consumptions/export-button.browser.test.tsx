import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { exportConsumption, exportConsumptionMonth, type CsvDownload } from '@/shared/api/consumptions/requests';

import { ConsumptionExportButton } from './export-button';

vi.mock('@/shared/api/consumptions/requests', () => ({
  exportConsumption: vi.fn<(id: string, signal?: AbortSignal) => Promise<CsvDownload>>(),
  exportConsumptionMonth: vi.fn<(year: number, month: string, signal?: AbortSignal) => Promise<CsvDownload>>(),
}));

const exportSingle = vi.mocked(exportConsumption);
const exportMonth = vi.mocked(exportConsumptionMonth);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:consumption-export');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

test('downloads a single consumption through the API', async () => {
  exportSingle.mockResolvedValue({ blob: new Blob(['csv']), fileName: 'consumption.csv' });
  const screen = await render(<ConsumptionExportButton consumptionId='consumption-42' />);

  await screen.getByRole('button', { name: 'Export consumption' }).click();

  expect(exportSingle).toHaveBeenCalledWith('consumption-42');
});

test('downloads the selected month through the API', async () => {
  exportMonth.mockResolvedValue({ blob: new Blob(['csv']), fileName: 'consumptions-2026-09.csv' });
  const screen = await render(<ConsumptionExportButton month='september' year={2026} />);

  await screen.getByRole('button', { name: 'Export monthly consumptions' }).click();

  expect(exportMonth).toHaveBeenCalledWith(2026, 'september');
});

test('disables an empty month export', async () => {
  const screen = await render(<ConsumptionExportButton disabled month='september' year={2026} />);

  await expect.element(screen.getByRole('button', { name: 'Export monthly consumptions' })).toBeDisabled();
});
