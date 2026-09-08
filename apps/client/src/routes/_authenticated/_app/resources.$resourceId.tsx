import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { createFileRoute } from '@tanstack/react-router';

import { ResourceTypeUpdateForm } from '@/app/resources/update-form';
import { resourceQueryOptions } from '@/shared/api/resources/options';

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
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Update {resource.name}</DialogTitle>
          <DialogDescription>Change the values.</DialogDescription>
        </DialogHeader>
        <ResourceTypeUpdateForm initialData={resource} onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
