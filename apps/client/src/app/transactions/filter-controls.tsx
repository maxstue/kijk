import { Button } from '@kijk/ui/components/button';
import { getRouteApi } from '@tanstack/react-router';
import { X } from 'lucide-react';

import { TransactionCategoryFilter } from '@/app/transactions/category-filter';
import { MonthSwitcher } from '@/shared/components/month-switcher';
const Route = getRouteApi('/_authenticated/_app/$spaceId/finances/transactions');

interface TransactionFilterControlsProps {
  compact?: boolean;
}
export function TransactionFilterControls({ compact = true }: TransactionFilterControlsProps) {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <MonthSwitcher
        month={search.month}
        year={search.year}
        onChange={(value) => navigate({ search: (previous) => ({ ...previous, ...value, page: undefined }) })}
      />
      {!search.uncategorized && (
        <TransactionCategoryFilter
          compact={compact}
          value={search.categoryIds ?? []}
          onChange={(categoryIds) =>
            navigate({
              search: (previous) => ({
                ...previous,
                categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
                page: undefined,
              }),
            })
          }
        />
      )}
      {(search.uncategorized || (search.categoryIds?.length ?? 0) > 0) && (
        <Button
          variant='ghost'
          onClick={() =>
            navigate({
              search: (previous) => ({
                ...previous,
                categoryIds: undefined,
                page: undefined,
                uncategorized: undefined,
              }),
            })
          }
        >
          Reset
          <X />
        </Button>
      )}
    </>
  );
}
