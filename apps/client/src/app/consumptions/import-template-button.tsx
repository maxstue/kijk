import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { Button } from '@kijk/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import { saveDownload } from '@/shared/utils/download';

/** Downloads the import template with an example row for every resource of the space. */
export function ConsumptionImportTemplateButton() {
  const spaceId = useSpaceId();
  const templateMutation = useMutation(consumptionsOptions.importTemplateMutationOptions(spaceId));

  const handleDownload = () =>
    templateMutation.mutate(undefined, {
      onSuccess: saveDownload,
      onError: (error) => toast.error('Download failed', { description: error.message }),
    });

  return (
    <Button
      className='h-auto p-0 text-xs'
      disabled={templateMutation.isPending}
      onClick={handleDownload}
      type='button'
      variant='link'
    >
      {templateMutation.isPending ? (
        <LoaderCircleIcon className='size-3 animate-spin' />
      ) : (
        <DownloadIcon className='size-3' />
      )}
      Download template
    </Button>
  );
}
