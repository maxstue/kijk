import type { ImportCandidatesQuery } from '@kijk/api/imports/types';
import { Button } from '@kijk/ui/components/button';
import { CardContent } from '@kijk/ui/components/card';
import { X, Sparkles } from 'lucide-react';
import { use } from 'react';

import { ListFilter } from '@/shared/components/list-filter';
import { SearchInput } from '@/shared/components/search-input';
import { useFeature } from '@/shared/hooks/use-feature';

import { ImportCandidateTable } from './candidate-table';
import { CardSettlements } from './card-settlements';
import { CategorizationProgress } from './review-adjustments';
import { ImportReviewContext } from './review-context';

export function ImportReviewTransactions() {
  const context = use(ImportReviewContext);
  if (!context) {
    throw new Error('ImportReviewTransactions requires ImportReview');
  }
  const {
    filters,
    cardPage,
    cardOpen,
    onCardPageChange,
    onCardOpenChange,
    onFilterChange,
    job,
    isPending,
    reviewQuery,
    selectedMonths,
    onPageChange,
    onAiPreviewChange,
    onResetOverrides,
  } = context;
  const aiImport = useFeature('aiImport');
  const review = reviewQuery.data;
  return (
    <CardContent className='flex flex-col gap-4 px-0'>
      <div className='flex flex-col gap-4 px-(--card-spacing)'>
        <div className='flex flex-wrap items-center gap-3'>
          <h3 className='flex-1 font-medium'>Transactions to import</h3>
          {aiImport && (
            <section aria-label='AI category suggestions' className='flex flex-wrap items-center gap-3'>
              <Button size='sm' variant='outline' disabled={isPending} onClick={() => onAiPreviewChange(true)}>
                <Sparkles data-icon='inline-start' /> Suggest categories
              </Button>
            </section>
          )}
          <Button
            variant='ghost'
            size='sm'
            disabled={isPending}
            title='Clears every manual category in this import to Uncategorized. Automatic categories and import selections are kept.'
            onClick={() => onResetOverrides()}
          >
            Reset overrides <X data-icon='inline-end' />
          </Button>
        </div>
        <p className='text-muted-foreground text-sm'>
          Choose a category to override it, or untick a transaction to leave it out. AI suggestions keep your manual
          choices.
        </p>
      </div>
      <div className='flex flex-wrap gap-3 px-(--card-spacing)'>
        <SearchInput
          aria-label='Search review transactions'
          placeholder='Search counterparty or purpose…'
          value={filters.search ?? ''}
          onSearch={(search) => onFilterChange({ search })}
        />
        <ListFilter
          label='Review rows'
          value={filters.filter}
          options={[
            { value: 'Uncategorized', label: 'Uncategorized' },
            { value: 'Errors', label: 'Unreadable' },
            { value: 'Excluded', label: 'Excluded' },
          ]}
          onChange={(filter) => onFilterChange({ filter: filter as ImportCandidatesQuery['filter'] })}
        />
      </div>
      {filters.filter === 'Errors' && (
        <p className='text-muted-foreground px-(--card-spacing) text-sm'>
          Unreadable rows from the entire file are shown because their month may be unknown.
        </p>
      )}
      <div className='relative' aria-busy={job.status === 'Categorizing'}>
        {review && (
          <div inert={isPending || reviewQuery.isPlaceholderData} aria-busy={reviewQuery.isFetching}>
            <CardSettlements
              page={cardPage}
              open={cardOpen}
              onPageChange={onCardPageChange}
              onOpenChange={onCardOpenChange}
              count={Number(review.cardSettlementCount)}
              months={selectedMonths}
              importId={job.id}
            />
            <ImportCandidateTable
              data={review}
              importId={job.id}
              isFetching={reviewQuery.isFetching}
              manualOverrides
              onPageChange={onPageChange}
            />
          </div>
        )}
        <CategorizationProgress active={job.status === 'Categorizing'} />
      </div>
    </CardContent>
  );
}
