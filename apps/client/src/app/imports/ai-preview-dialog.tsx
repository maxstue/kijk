import type { ImportJob } from '@kijk/api/imports/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';

import { ImportAiCategorization } from '@/app/imports/ai-preview';

interface AiPreviewDialogProps {
  job: ImportJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AiPreviewDialog({ job, open, onOpenChange }: AiPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Suggest categories automatically</DialogTitle>
          <DialogDescription>
            Choose which uncategorized transactions the AI may process. Your category choices stay unchanged and are not
            sent as examples. Review the suggestions in the transaction list afterwards.
          </DialogDescription>
        </DialogHeader>
        <ImportAiCategorization job={job} onStarted={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
