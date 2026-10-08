import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCategorizeImport } from '@/app/imports/use-import-mutations';
import { importAiPreviewQueryOptions } from '@/shared/api/imports/options';
import type { AiPreviewItem, ImportJob } from '@/shared/api/imports/types';
import { currentUserQueryOptions } from '@/shared/api/users/options';

/** Lets the user check and exclude shared texts before requesting category suggestions. */
export function ImportAiCategorization({ job, onStarted }: { job: ImportJob; onStarted?: () => void }) {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  if (!currentUser?.user) {
    return null;
  }
  if (!currentUser.user.aiEnabled) {
    return (
      <p className='text-muted-foreground text-sm'>
        AI category suggestions are off. You can turn them on in Settings → Info.
      </p>
    );
  }
  return <AiPreviewCard job={job} onStarted={onStarted} />;
}

function AiPreviewCard({ job, onStarted }: { job: ImportJob; onStarted?: () => void }) {
  const { data, isPending } = useQuery(importAiPreviewQueryOptions(job.id));
  const categorizeMutation = useCategorizeImport(job.id);
  const [selection, setSelection] = useState<Record<string, boolean>>({});

  if (isPending || !data) {
    return (
      <Card className='min-w-0'>
        <CardContent className='flex justify-center py-8'>
          <SpinnerIcon className='size-5 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  const selected = data.items.filter((item) => selection[item.key] ?? !item.excluded);
  const selectedRows = selected.reduce((sum, item) => sum + Number(item.rowCount), 0);
  const withheld = Number(data.withheldRows);

  function onSend() {
    categorizeMutation.mutate(
      { aiDataSharing: 'Strict', selectedTextKeys: selected.map((item) => item.key) },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => onStarted?.(),
      },
    );
  }

  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Sparkles className='size-4' /> What the AI would see
        </CardTitle>
        <CardDescription>
          The AI suggests categories for uncategorized transactions. Check the texts below before sharing them. IBANs,
          reference numbers, e-mail addresses and names of private persons are replaced; amounts, dates and accounts
          stay here. Names cannot be recognized with certainty, so deselect anything you want to keep private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.items.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Every row already has a category; nothing would be sent.</p>
        ) : (
          <div className='max-h-96 min-w-0 overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>Send</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className='text-right'>Rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <AiPreviewRow
                    key={item.key}
                    item={item}
                    checked={selection[item.key] ?? !item.excluded}
                    disabled={categorizeMutation.isPending || job.status === 'Categorizing'}
                    onCheckedChange={(checked) => setSelection((previous) => ({ ...previous, [item.key]: checked }))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-muted-foreground text-sm'>
          {selected.length} texts for {selectedRows} rows
          {withheld > 0 && ` · ${withheld} rows withheld because nothing useful remains after cleaning`}
        </span>
        <Button
          disabled={categorizeMutation.isPending || job.status === 'Categorizing' || selected.length === 0}
          size='sm'
          onClick={onSend}
        >
          {categorizeMutation.isPending ? <SpinnerIcon className='size-4 animate-spin' /> : 'Suggest categories'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AiPreviewRow({
  item,
  checked,
  disabled,
  onCheckedChange,
}: {
  item: AiPreviewItem;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <TableRow className={cn(!checked && 'opacity-50')}>
      <TableCell>
        <Checkbox
          aria-label='Send this text to the AI'
          checked={checked}
          disabled={disabled}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
        />
      </TableCell>
      <TableCell className='font-medium'>
        {item.counterparty ?? '—'}{' '}
        {item.incoming && (
          <Badge className='ml-1' variant='outline'>
            Incoming
          </Badge>
        )}
      </TableCell>
      <TableCell className='text-muted-foreground max-w-96 truncate text-sm'>{item.purpose ?? '—'}</TableCell>
      <TableCell className='text-right'>{Number(item.rowCount)}</TableCell>
    </TableRow>
  );
}
