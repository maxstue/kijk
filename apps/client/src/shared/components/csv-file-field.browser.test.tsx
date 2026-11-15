import { toast } from 'sonner';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { CsvFileField, CsvFileFieldDescription, CsvFileFieldInput, CsvFileFieldLabel } from './csv-file-field';

vi.mock('sonner', { spy: true });

interface Props {
  onFileChange: (file: File | undefined) => void;
}

function Field({ onFileChange }: Props) {
  return (
    <CsvFileField maxBytes={1024 * 1024} onFileChange={onFileChange}>
      <CsvFileFieldLabel>CSV file</CsvFileFieldLabel>
      <CsvFileFieldDescription>Choose a file.</CsvFileFieldDescription>
      <CsvFileFieldInput />
    </CsvFileField>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('links label and description and appends the size limit', async () => {
  const screen = await render(<Field onFileChange={vi.fn<(file: File | undefined) => void>()} />);

  const input = screen.getByLabelText('CSV file');
  await expect.element(input).toHaveAttribute('type', 'file');
  await expect.element(input).toHaveAccessibleDescription('Choose a file. Maximum 1 MB.');
});

test('passes files within the limit and rejects larger ones', async () => {
  const onFileChange = vi.fn<(file: File | undefined) => void>();
  const screen = await render(<Field onFileChange={onFileChange} />);
  const small = new File(['Date'], 'small.csv', { type: 'text/csv' });

  await screen.getByLabelText('CSV file').upload(small);
  expect(onFileChange).toHaveBeenLastCalledWith(small);

  await screen.getByLabelText('CSV file').upload(new File([new Uint8Array(1024 * 1024 + 1)], 'large.csv'));
  expect(onFileChange).toHaveBeenLastCalledWith(undefined);
  expect(toast.error).toHaveBeenCalledWith('File too large', { description: 'CSV files can be at most 1 MB.' });
});
