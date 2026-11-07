import type { Category } from '@kijk/api/categories/types';
import * as importsOptions from '@kijk/api/imports/options';
import type { ImportCandidate } from '@kijk/api/imports/types';
import { Badge } from '@kijk/ui/components/badge';
import { Checkbox } from '@kijk/ui/components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { TableCell, TableRow } from '@kijk/ui/components/table';
import { useMutation } from '@tanstack/react-query';
import { cn } from 'cn';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { formatStringToCurrency } from '@/shared/utils/format';

const uncategorized = 'none';

interface CandidateRowProps {
  candidate: ImportCandidate;
  categories: Category[];
  importId: string;
  manualOverrides: boolean;
}

export function CandidateRow({ candidate, categories, importId, manualOverrides }: CandidateRowProps) {
  const spaceId = useSpaceId();
  const updateMutation = useMutation(importsOptions.updateCandidateMutationOptions(spaceId));

  function update(change: { categoryId?: string | null; excluded?: boolean }) {
    updateMutation.mutate(
      {
        candidate: { categoryId: candidate.categoryId ?? null, excluded: candidate.excluded, ...change },
        candidateId: candidate.id,
        importId,
      },
      { onError: (error) => toast.error(error.name, { description: error.message }) },
    );
  }

  return (
    <TableRow
      data-excluded={candidate.excluded || undefined}
      className={cn(candidate.excluded && 'bg-muted/30 text-muted-foreground [&>td:not(:first-child)]:opacity-50')}
    >
      <TableCell>
        <Checkbox
          aria-label='Import this row'
          checked={!candidate.excluded}
          disabled={updateMutation.isPending}
          onCheckedChange={(checked) => update({ excluded: checked !== true })}
        />
      </TableCell>
      <TableCell className='whitespace-nowrap'>{candidate.bookingDate}</TableCell>
      <TableCell>
        <div className='font-medium'>{candidate.counterparty ?? '—'}</div>
        {candidate.purpose && (
          <div className='text-muted-foreground max-w-80 truncate text-xs'>{candidate.purpose}</div>
        )}
        {candidate.status === 'Pending' && <div className='text-muted-foreground text-xs'>Pending</div>}
        {candidate.isCardSettlement && (
          <Badge className='mt-1' variant='outline'>
            {candidate.countsAsOffset ? 'Card statement · offset' : 'Card statement'}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <CandidateCategory
          candidate={candidate}
          categories={categories}
          editable={manualOverrides}
          disabled={updateMutation.isPending || candidate.excluded}
          onChange={(categoryId) => update({ categoryId })}
        />
      </TableCell>
      <TableCell className='text-right whitespace-nowrap'>{formatStringToCurrency(candidate.amount ?? 0)}</TableCell>
    </TableRow>
  );
}

interface CandidateCategoryProps {
  candidate: ImportCandidate;
  categories: Category[];
  editable: boolean;
  disabled: boolean;
  onChange: (categoryId: string | null) => void;
}

function CandidateCategory({ candidate, categories, editable, disabled, onChange }: CandidateCategoryProps) {
  return (
    <>
      {editable ? (
        <Select
          disabled={disabled}
          items={[
            { label: 'Uncategorized', value: uncategorized },
            ...categories.map((category) => ({ label: category.name, value: category.id })),
          ]}
          value={candidate.categoryId ?? uncategorized}
          onValueChange={(value) => onChange(value === uncategorized ? null : value)}
        >
          <SelectTrigger aria-label='Category' className='w-44' size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={uncategorized}>Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div>{categories.find((category) => category.id === candidate.categoryId)?.name ?? 'Uncategorized'}</div>
      )}
      <div className='mt-1 flex h-6 items-center'>
        <CandidateCategoryStatus candidate={candidate} />
      </div>
    </>
  );
}

interface CandidateCategoryStatusProps {
  candidate: ImportCandidate;
}

function CandidateCategoryStatus({ candidate }: CandidateCategoryStatusProps) {
  if (candidate.excluded) {
    return <span className='text-xs'>Not imported</span>;
  }
  if (candidate.categorySource === 'Ai') {
    return (
      <Badge variant='outline'>
        <Sparkles className='size-3' /> AI suggestion
      </Badge>
    );
  }
  if (candidate.categoryId && candidate.categorySource === 'Manual') {
    return <Badge variant='outline'>Manual override</Badge>;
  }
  return null;
}
