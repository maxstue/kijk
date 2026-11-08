import * as resourcesOptions from '@kijk/api/resources/options';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmation } from '@/shared/components/delete-confirmation';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import type { Resource } from '@/shared/types/domain';

interface Props {
  onClose: () => void;
  resourceType: Resource;
}

/** Confirmation dialog content for deleting a resource. */
export function ResourceTypeDeleteContent({ onClose, resourceType }: Props) {
  const spaceId = useSpaceId();
  const { isPending, mutate } = useMutation(resourcesOptions.deleteMutationOptions(spaceId));

  const handleDelete = () => {
    mutate(
      { id: resourceType.id },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success(`Successfully deleted: ${resourceType.name}`);
          onClose();
        },
      },
    );
  };

  return (
    <DeleteConfirmation
      title='Are you absolutely sure?'
      description='Only unused resource types can be deleted. Existing consumptions and limits are never deleted automatically.'
      isPending={isPending}
      onConfirm={handleDelete}
    />
  );
}
