import { browserStorage } from '@kijk/core/lib/browser-storage';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCategorizeTransaction } from '@/app/transactions/use-transaction-mutations';
import { categoryRuleSuggestionsQueryOptions } from '@/shared/api/category-rules/options';
import type { CategoryRuleSuggestion } from '@/shared/api/category-rules/types';

const hiddenKey = 'hidden-rule-suggestions';
const hiddenSchema = z.array(z.string());

// Hiding is a per-browser convenience; without storage every suggestion simply stays visible.
function readHidden(): string[] {
  try {
    return browserStorage.getItem(hiddenKey, hiddenSchema) ?? [];
  } catch {
    return [];
  }
}

function writeHidden(ids: string[]) {
  try {
    browserStorage.setItem(hiddenKey, ids);
  } catch {
    // Storage may be unavailable, e.g. in private windows.
  }
}

/**
 * Rules suggested from repeated manual corrections. Remembering one creates the rule and categorizes the matching open
 * transactions, so recurring bookings no longer need the AI.
 */
export function RuleSuggestions({ canRecord }: { canRecord: boolean }) {
  const { data } = useQuery(categoryRuleSuggestionsQueryOptions());
  const [hidden, setHidden] = useState(readHidden);
  const hiddenIds = new Set(hidden);
  const visible = (data ?? []).filter((suggestion) => !hiddenIds.has(suggestion.id));
  if (visible.length === 0) {
    return null;
  }

  function hide(id: string) {
    const next = [...hidden, id];
    setHidden(next);
    writeHidden(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Lightbulb className='size-4' /> Suggested rules
        </CardTitle>
        <CardDescription>
          You set the same category for these more than once. Remember it, and Kijk categorizes them from now on.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className='divide-y'>
          {visible.map((suggestion) => (
            <SuggestionRow
              key={suggestion.id}
              canRecord={canRecord}
              suggestion={suggestion}
              onHide={() => hide(suggestion.id)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SuggestionRow({
  canRecord,
  onHide,
  suggestion,
}: {
  canRecord: boolean;
  onHide: () => void;
  suggestion: CategoryRuleSuggestion;
}) {
  const categorizeMutation = useCategorizeTransaction();
  const uncategorized = Number(suggestion.uncategorizedCount);

  function onRemember() {
    categorizeMutation.mutate(
      { correction: { categoryId: suggestion.categoryId, remember: true }, id: suggestion.transactionId },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: ({ appliedToOthers }) =>
          toast.success(`${suggestion.label} is now ${suggestion.categoryName}`, {
            description: `${Number(appliedToOthers)} more transactions categorized`,
          }),
      },
    );
  }

  return (
    <li className='flex flex-wrap items-center justify-between gap-3 py-2'>
      <div className='min-w-0'>
        <div className='font-medium'>
          {suggestion.label || 'Unnamed counterparty'} → {suggestion.categoryName}
        </div>
        <div className='text-muted-foreground text-xs'>
          Set by hand {Number(suggestion.manualCount)}×
          {uncategorized > 0 && ` · categorizes ${uncategorized} open transaction${uncategorized === 1 ? '' : 's'}`}
        </div>
      </div>
      <div className='flex gap-2'>
        <Button size='sm' variant='ghost' onClick={onHide}>
          Hide
        </Button>
        <Button disabled={!canRecord || categorizeMutation.isPending} size='sm' onClick={onRemember}>
          Remember
        </Button>
      </div>
    </li>
  );
}
