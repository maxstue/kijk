import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { toast } from 'sonner';

import { useCategorizeTransaction } from '@/app/transactions/use-transaction-mutations';
import type { Transaction } from '@/shared/api/transactions/types';

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
  const categorizeMutation = useCategorizeTransaction();

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
      <DialogContent className='sm:max-w-md'>
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
