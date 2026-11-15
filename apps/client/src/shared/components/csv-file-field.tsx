import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { cn } from 'cn';
import { createContext, use, useId, type ChangeEvent, type ComponentProps } from 'react';
import { toast } from 'sonner';

interface CsvFileFieldContextValue {
  descriptionId: string;
  inputId: string;
  maxBytes: number;
  onFileChange: (file: File | undefined) => void;
}

const CsvFileFieldContext = createContext<CsvFileFieldContextValue | null>(null);

function useCsvFileField() {
  const context = use(CsvFileFieldContext);
  if (!context) {
    throw new Error('CsvFileField parts must be used within CsvFileField');
  }
  return context;
}

const toMegabytes = (bytes: number) => bytes / 1024 / 1024;

interface Props extends ComponentProps<'div'> {
  maxBytes: number;
  onFileChange: (file: File | undefined) => void;
}

interface CsvFileFieldLabelProps extends ComponentProps<typeof Label> {}

interface CsvFileFieldDescriptionProps extends ComponentProps<'p'> {}

interface CsvFileFieldInputProps extends Omit<ComponentProps<typeof Input>, 'accept' | 'id' | 'onChange' | 'type'> {}

/** File selection for CSV uploads; links label and description and rejects files above `maxBytes`. */
function CsvFileField({ className, maxBytes, onFileChange, ...props }: Props) {
  const id = useId();

  return (
    <CsvFileFieldContext value={{ descriptionId: `${id}-description`, inputId: `${id}-input`, maxBytes, onFileChange }}>
      <div data-slot='csv-file-field' className={cn('grid gap-2', className)} {...props} />
    </CsvFileFieldContext>
  );
}

function CsvFileFieldLabel(props: CsvFileFieldLabelProps) {
  const { inputId } = useCsvFileField();

  return <Label htmlFor={inputId} {...props} />;
}

/** Help text of the field; the size limit is appended. */
function CsvFileFieldDescription({ className, children, ...props }: CsvFileFieldDescriptionProps) {
  const { descriptionId, maxBytes } = useCsvFileField();

  return (
    <p
      data-slot='csv-file-field-description'
      id={descriptionId}
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    >
      {children} Maximum {toMegabytes(maxBytes)} MB.
    </p>
  );
}

function CsvFileFieldInput(props: CsvFileFieldInputProps) {
  const { descriptionId, inputId, maxBytes, onFileChange } = useCsvFileField();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > maxBytes) {
      toast.error('File too large', { description: `CSV files can be at most ${toMegabytes(maxBytes)} MB.` });
      event.target.value = '';
      onFileChange(undefined);
      return;
    }
    onFileChange(file);
  };

  return (
    <Input
      accept='.csv,text/csv'
      aria-describedby={descriptionId}
      id={inputId}
      type='file'
      onChange={handleChange}
      {...props}
    />
  );
}

export { CsvFileField, CsvFileFieldDescription, CsvFileFieldInput, CsvFileFieldLabel };
