import * as consumptionsApi from '@kijk/api/consumptions/requests';
import { type CsvDownload } from '@kijk/api/consumptions/requests';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, expect, onTestFinished, test, vi } from 'vite-plus/test';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { render as renderInSpace } from '@/test/render-space';

import { ConsumptionExportButton } from './export-button';

vi.mock('@/shared/hooks/use-space-permission', () => ({
  useSpacePermission: vi.fn<() => boolean>(() => true),
}));

vi.mock('@kijk/api/consumptions/requests', { spy: true });

vi.mock('sonner', { spy: true });

async function render(ui: ReactNode) {
  const client = new QueryClient();
  const screen = await renderInSpace(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  return screen;
}

const exportSingle = vi.mocked(consumptionsApi.exportCsv);
const exportMonth = vi.mocked(consumptionsApi.exportMonth);
const downloadClick = vi.fn<() => void>();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSpacePermission).mockReturnValue(true);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:consumption-export');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(downloadClick);
});

test('downloads a single consumption through the API', async () => {
  exportSingle.mockResolvedValue({ blob: new Blob(['csv']), fileName: 'consumption.csv' });
  const screen = await render(<ConsumptionExportButton consumptionId='consumption-42' />);

  await screen.getByRole('button', { name: 'Export consumption' }).click();

  expect(exportSingle).toHaveBeenCalledWith('space', 'consumption-42');
});

test('downloads the selected month through the API', async () => {
  exportMonth.mockResolvedValue({ blob: new Blob(['csv']), fileName: 'consumptions-2026-09.csv' });
  const screen = await render(<ConsumptionExportButton month='september' year={2026} />);

  await screen.getByRole('button', { name: 'Export monthly consumptions' }).click();

  expect(exportMonth).toHaveBeenCalledWith('space', 2026, 'september');
});

test('disables an empty month export', async () => {
  const screen = await render(<ConsumptionExportButton disabled month='september' year={2026} />);

  await expect.element(screen.getByRole('button', { name: 'Export monthly consumptions' })).toBeDisabled();
});

test('disables single and monthly exports without the export permission', async () => {
  vi.mocked(useSpacePermission).mockReturnValue(false);
  const screen = await render(
    <>
      <ConsumptionExportButton consumptionId='consumption-42' />
      <ConsumptionExportButton month='september' year={2026} />
    </>,
  );
  await expect.element(screen.getByRole('button', { name: 'Export consumption', exact: true })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Export monthly consumptions' })).toBeDisabled();
  expect(exportSingle).not.toHaveBeenCalled();
  expect(exportMonth).not.toHaveBeenCalled();
});

test('blocks duplicate exports while pending and allows retry after an error', async () => {
  const pending = Promise.withResolvers<CsvDownload>();
  exportSingle.mockReturnValueOnce(pending.promise);
  const screen = await render(<ConsumptionExportButton consumptionId='consumption-42' />);
  const button = screen.getByRole('button', { name: 'Export consumption' });
  await button.click();
  await expect.element(button).toBeDisabled();
  expect(exportSingle).toHaveBeenCalledTimes(1);

  pending.reject(new Error('Download unavailable'));
  await expect.element(button).toBeEnabled();
  expect(toast.error).toHaveBeenCalledWith('Export failed', { description: 'Download unavailable' });

  exportSingle.mockResolvedValueOnce({ blob: new Blob(['csv']), fileName: 'consumption.csv' });
  await button.click();
  await vi.waitFor(() => expect(downloadClick).toHaveBeenCalledTimes(1));
  await expect.element(button).toBeEnabled();
});
