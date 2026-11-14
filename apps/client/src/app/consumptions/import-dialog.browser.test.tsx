import * as consumptionsApi from '@kijk/api/consumptions/requests';
import type { ConsumptionImportResult } from '@kijk/api/consumptions/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { beforeEach, expect, onTestFinished, test, vi } from 'vite-plus/test';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { render as renderInSpace } from '@/test/render-space';

import { ConsumptionImportDialog } from './import-dialog';

vi.mock('@/shared/hooks/use-space-permission', () => ({
  useSpacePermission: vi.fn<() => boolean>(() => true),
}));

vi.mock('@kijk/api/consumptions/requests', { spy: true });

vi.mock('sonner', { spy: true });

const importCsv = vi.mocked(consumptionsApi.importCsv);
const getImportTemplate = vi.mocked(consumptionsApi.getImportTemplate);
const csv = new File(['Date,Resource,Value\n2026-01-31,Electricity,1000\n'], 'consumptions.csv', { type: 'text/csv' });

async function openDialog() {
  const client = new QueryClient();
  const screen = await renderInSpace(
    <QueryClientProvider client={client}>
      <ConsumptionImportDialog />
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });
  await screen.getByRole('button', { name: 'Import CSV' }).click();
  return screen;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSpacePermission).mockReturnValue(true);
});

test('imports the selected file and closes with a summary', async () => {
  importCsv.mockResolvedValue({ importedCount: 3, skippedCount: 1, errorCount: 0, errorSamples: [] });
  const screen = await openDialog();

  await screen.getByLabelText('CSV file').upload(csv);
  await screen.getByRole('button', { name: 'Import', exact: true }).click();

  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith('3 consumptions imported', {
      description: '1 rows already existed and were skipped.',
    }),
  );
  expect(importCsv).toHaveBeenCalledWith('space', csv);
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
});

test('keeps the dialog open with the rejected rows until another file is chosen', async () => {
  const rejected: ConsumptionImportResult = {
    importedCount: 0,
    skippedCount: 0,
    errorCount: 2,
    errorSamples: [{ rowNumber: 3, errors: "Resource 'Water' is not available in this space" }],
  };
  importCsv.mockResolvedValue(rejected);
  const screen = await openDialog();

  await screen.getByLabelText('CSV file').upload(csv);
  await screen.getByRole('button', { name: 'Import', exact: true }).click();

  await expect.element(screen.getByText('2 rows could not be imported, so nothing was saved')).toBeVisible();
  await expect.element(screen.getByText("Row 3: Resource 'Water' is not available in this space")).toBeVisible();
  await expect.element(screen.getByText('… and 1 more')).toBeVisible();
  expect(toast.success).not.toHaveBeenCalled();

  await screen.getByLabelText('CSV file').upload(new File(['fixed'], 'fixed.csv', { type: 'text/csv' }));
  await expect.element(screen.getByText('2 rows could not be imported, so nothing was saved')).not.toBeInTheDocument();
});

test('keeps the file selection locked until the running import finishes', async () => {
  const pending = Promise.withResolvers<ConsumptionImportResult>();
  importCsv.mockReturnValueOnce(pending.promise);
  const screen = await openDialog();

  await screen.getByLabelText('CSV file').upload(csv);
  await screen.getByRole('button', { name: 'Import', exact: true }).click();

  await expect.element(screen.getByLabelText('CSV file')).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Importing…' })).toBeDisabled();
  pending.resolve({ importedCount: 1, skippedCount: 0, errorCount: 0, errorSamples: [] });
  await vi.waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith('1 consumptions imported', { description: undefined }),
  );
  expect(importCsv).toHaveBeenCalledTimes(1);
});

test('downloads the template from the API', async () => {
  getImportTemplate.mockResolvedValue({ blob: new Blob(['csv']), fileName: 'consumptions-import-template.csv' });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:template');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  const screen = await openDialog();

  await screen.getByRole('button', { name: 'Download template' }).click();

  expect(getImportTemplate).toHaveBeenCalledWith('space');
  await vi.waitFor(() => expect(click).toHaveBeenCalledTimes(1));
});

test('cannot be opened without the record permission', async () => {
  vi.mocked(useSpacePermission).mockReturnValue(false);
  const client = new QueryClient();
  const screen = await renderInSpace(
    <QueryClientProvider client={client}>
      <ConsumptionImportDialog />
    </QueryClientProvider>,
  );
  onTestFinished(async () => {
    await screen.unmount();
    client.clear();
  });

  await expect.element(screen.getByRole('button', { name: 'Import CSV' })).toBeDisabled();
});
