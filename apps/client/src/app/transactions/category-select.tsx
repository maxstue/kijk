import * as categoriesOptions from '@kijk/api/categories/options';
import * as transactionsOptions from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { RememberDialog } from '@/app/transactions/remember-dialog';
import { noneValue } from '@/app/transactions/schemas';
import { useSpaceId } from '@/shared/hooks/use-active-space';

interface CategorySelectProps {
  disabled: boolean;
  transaction: Transaction;
}

export function CategorySelect({ disabled, transaction }: CategorySelectProps) {
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));
  const categorizeMutation = useMutation(transactionsOptions.categorizeMutationOptions(spaceId));
  const [rememberTarget, setRememberTarget] = useState<{ categoryId: string; transaction: Transaction }>();

  function onChange(value: string | null) {
    const categoryId = value === noneValue ? null : value;
    categorizeMutation.mutate(
      { correction: { categoryId, remember: false }, id: transaction.id },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: ({ transaction: updated }) => {
          if (!categoryId || (!updated.rememberScope && updated.rememberKeywords.length === 0)) {
            return;
          }
          toast.success('Only this transaction was changed', {
            action: { label: 'Remember…', onClick: () => setRememberTarget({ categoryId, transaction: updated }) },
          });
        },
      },
    );
  }

  const rememberCategoryName = categories.find((category) => category.id === rememberTarget?.categoryId)?.name ?? '';
  return (
    <>
      {rememberTarget && (
        <RememberDialog
          categoryId={rememberTarget.categoryId}
          categoryName={rememberCategoryName}
          transaction={rememberTarget.transaction}
          onClose={() => setRememberTarget(undefined)}
        />
      )}
      <Select
        disabled={disabled || categorizeMutation.isPending}
        items={[
          { label: 'Uncategorized', value: noneValue },
          ...categories.map((category) => ({ label: category.name, value: category.id })),
        ]}
        value={transaction.categoryId ?? noneValue}
        onValueChange={onChange}
      >
        <SelectTrigger aria-label='Category' className='w-44' size='sm'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={noneValue}>Uncategorized</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
