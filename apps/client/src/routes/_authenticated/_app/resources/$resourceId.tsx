import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { ResourceTypeUpdateForm } from '@/app/resources/update-form';
import { resourceQueryOptions } from '@/shared/api/resources/options';

/** `/resources/$resourceId`: edit dialog of a resource. */
export const Route = createFileRoute('/_authenticated/_app/resources/$resourceId')({
  component: ResourceEditDialog,
});

function ResourceEditDialog() {
  const navigate = Route.useNavigate();
  const closeDialog = () =>
    navigate({
      replace: true,
      to: '/resources',
      search: (previous) => previous,
    });

  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <ResourceEditContent onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}

function ResourceEditContent({ onClose }: { onClose: () => void }) {
  const { resourceId } = Route.useParams();
  const { data: resource } = useSuspenseQuery(resourceQueryOptions(resourceId));
  return (
    <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
      <DialogHeader>
        <DialogTitle>Update {resource.name}</DialogTitle>
        <DialogDescription>Change the values.</DialogDescription>
      </DialogHeader>
      <ResourceTypeUpdateForm initialData={resource} onClose={onClose} />
    </div>
  );
}
