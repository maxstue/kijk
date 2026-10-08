import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { createFileRoute } from '@tanstack/react-router';

import { ResourceTypeUpdateForm } from '@/app/resources/update-form';
import { resourceQueryOptions } from '@/shared/api/resources/options';

/** `/resources/$resourceId`: edit dialog of a resource. */
export const Route = createFileRoute('/_authenticated/_app/resources/$resourceId')({
  loader: ({ context: { queryClient }, params: { resourceId } }) =>
    queryClient.ensureQueryData(resourceQueryOptions(resourceId)),
  component: ResourceEditDialog,
});

function ResourceEditDialog() {
  const resource = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const closeDialog = () =>
    navigate({
      replace: true,
      to: '/resources',
      search: (previous) => previous,
    });

  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className='sm:max-w-lg'>
        <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Update {resource.name}</DialogTitle>
            <DialogDescription>Change the values.</DialogDescription>
          </DialogHeader>
          <ResourceTypeUpdateForm initialData={resource} onClose={closeDialog} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
