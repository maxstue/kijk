import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useState } from 'react';
import type { ReactElement } from 'react';

import { TransactionForm } from '@/app/transactions/form';
interface CreateTransactionDialogProps {
  children: ReactElement;
}
export function CreateTransactionDialog({ children }: CreateTransactionDialogProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  return (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>Record a booking by hand.</DialogDescription>
        </DialogHeader>
        <TransactionForm onClose={() => setShowCreateDialog(false)} />
      </DialogContent>
    </Dialog>
  );
}
