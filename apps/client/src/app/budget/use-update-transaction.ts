import { useMutation } from '@tanstack/react-query';

import { TransactionFormValues } from '@/app/budget/schemas';
import { updateTransaction } from '@/shared/api/transactions';

interface Data {
  transactionId: string;
  newTransaction: Partial<TransactionFormValues>;
}

export const useUpdateTransaction = () => {
  return useMutation({
    mutationFn: (data: Data) => updateTransaction(data.transactionId, data.newTransaction),
  });
};
