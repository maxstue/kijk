import * as transactionsOptions from '@kijk/api/transactions/options';
import type { Transaction } from '@kijk/api/transactions/types';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';

interface Props {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  transaction: Transaction;
}

/**
 * Lets the user remember a corrected category for the merchant or counterparty, or for a word of the purpose. A keyword
 * rule stores nothing about the counterparty.
 */
export function RememberDialog({ categoryId, categoryName, onClose, transaction }: Props) {
  const spaceId = useSpaceId();
  const categorizeMutation = useMutation(transactionsOptions.categorizeMutationOptions(spaceId));

  function remember(keyword?: string) {
    categorizeMutation.mutate(
      { correction: { categoryId, keyword: keyword ?? null, remember: true }, id: transaction.id },
      {
        onError: (error) => toast.error(error.name, { description: error.message }),
        onSuccess: ({ appliedToOthers }) => {
          toast.success(`Remembered as ${categoryName}; ${appliedToOthers} other transactions updated`);
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remember {categoryName}</DialogTitle>
          <DialogDescription>
            Future imports get this category automatically. Corrections by hand always win.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          {transaction.rememberScope && (
            <Button disabled={categorizeMutation.isPending} variant='outline' onClick={() => remember()}>
              {transaction.rememberScope === 'Merchant' ? 'For this merchant' : 'For this counterparty'}
              {transaction.counterparty ? ` (${transaction.counterparty})` : ''}
            </Button>
          )}
          {transaction.rememberKeywords.length > 0 && (
            <div className='space-y-2'>
              <p className='text-muted-foreground text-sm'>For all bookings whose purpose contains the word:</p>
              <div className='flex flex-wrap gap-2'>
                {transaction.rememberKeywords.map((keyword) => (
                  <Button
                    key={keyword}
                    disabled={categorizeMutation.isPending}
                    size='sm'
                    variant='secondary'
                    onClick={() => remember(keyword)}
                  >
                    {keyword}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
