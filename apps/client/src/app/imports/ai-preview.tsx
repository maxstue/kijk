import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@kijk/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Sparkles, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCategorizeImport, useUpdateImportAiPreviewItem } from '@/app/imports/use-import-mutations';
import { importAiPreviewQueryOptions, importSettingsQueryOptions } from '@/shared/api/imports/options';
import type { AiPreviewItem, ImportJob } from '@/shared/api/imports/types';
import { currentUserQueryOptions } from '@/shared/api/users/options';

/**
 * AI categorization of an import: shows exactly what would be sent, lets the user deselect texts and starts it. Hidden
 * when the user turned AI off; collapsed when the household's default is Off.
 */
export function ImportAiCategorization({ job }: { job: ImportJob }) {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const { data: settings } = useQuery(importSettingsQueryOptions());
  const [opened, setOpened] = useState(false);
  if (currentUser?.user?.aiEnabled === false) {
    return null;
  }

  const categorizedCount = Number(job.aiCategorizedCount);
  return (
    <div className='space-y-4'>
      {job.aiCategorizationUnavailable && (
        <Alert variant='destructive'>
          <TriangleAlert />
          <AlertTitle>The AI could not suggest all categories</AlertTitle>
          <AlertDescription>
            Nothing was lost. Import the rows as they are and add categories later, or send them again.
          </AlertDescription>
        </Alert>
      )}
      {!job.aiCategorizationUnavailable && categorizedCount > 0 && (
        <Alert>
          <Sparkles />
          <AlertTitle>The AI suggested {categorizedCount} categories</AlertTitle>
          <AlertDescription>
            Suggestions are marked in the table and never replace a category you chose.
          </AlertDescription>
        </Alert>
      )}
      {opened || settings?.aiDataSharing === 'Strict' ? (
        <AiPreviewCard job={job} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='size-4' /> Suggest categories with the AI
            </CardTitle>
            <CardDescription>
              AI categorization is off for this space. You can still use it for this import and check first what would
              be sent.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button size='sm' variant='outline' onClick={() => setOpened(true)}>
              Show what would be sent
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function AiPreviewCard({ job }: { job: ImportJob }) {
  const { data, isPending } = useQuery(importAiPreviewQueryOptions(job.id));
  const categorizeMutation = useCategorizeImport(job.id);

  if (isPending || !data) {
    return (
      <Card>
        <CardContent className='flex justify-center py-8'>
          <SpinnerIcon className='size-5 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  const selected = data.items.filter((item) => !item.excluded);
  const selectedRows = selected.reduce((sum, item) => sum + Number(item.rowCount), 0);
  const withheld = Number(data.withheldRows);

  function onSend() {
    categorizeMutation.mutate(
      { aiDataSharing: 'Strict' },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: () => toast.success('The AI is suggesting categories'),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Sparkles className='size-4' /> What the AI would see
        </CardTitle>
        <CardDescription>
          Exactly these texts are sent for rows without a category, each text only once. IBANs, reference numbers,
          e-mail addresses and names of private persons are replaced; amounts, dates and accounts stay here. Names
          cannot be recognized with certainty, so deselect anything you want to keep private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.items.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Every row already has a category; nothing would be sent.</p>
        ) : (
          <div className='max-h-96 overflow-y-auto'>
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
                  <AiPreviewRow key={item.key} importId={job.id} item={item} />
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
        <Button disabled={categorizeMutation.isPending || selected.length === 0} size='sm' onClick={onSend}>
          {categorizeMutation.isPending ? (
            <SpinnerIcon className='size-4 animate-spin' />
          ) : (
            `Send ${selected.length} texts to the AI`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AiPreviewRow({ importId, item }: { importId: string; item: AiPreviewItem }) {
  const updateMutation = useUpdateImportAiPreviewItem(importId);

  function onCheckedChange(checked: boolean) {
    updateMutation.mutate(
      { excluded: !checked, key: item.key },
      { onError: (error) => toast.error(error.name, { description: error.message }) },
    );
  }

  return (
    <TableRow className={cn(item.excluded && 'opacity-50')}>
      <TableCell>
        <Checkbox
          aria-label='Send this text to the AI'
          checked={!item.excluded}
          disabled={updateMutation.isPending}
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
