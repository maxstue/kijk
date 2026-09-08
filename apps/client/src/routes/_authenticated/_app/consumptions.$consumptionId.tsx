import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { createFileRoute } from '@tanstack/react-router';

import { ConsumptionLimitWarning } from '@/app/consumptions/limit-warning';
import { ConsumptionUpdateForm } from '@/app/consumptions/update-form';
import { consumptionQueryOptions } from '@/shared/api/consumptions/options';

export const Route = createFileRoute('/_authenticated/_app/consumptions/$consumptionId')({
  loader: ({ context: { queryClient }, params: { consumptionId } }) =>
    queryClient.ensureQueryData(consumptionQueryOptions(consumptionId)),
  component: ConsumptionEditDialog,
});

function ConsumptionEditDialog() {
  const consumption = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const closeDialog = () =>
    navigate({
      replace: true,
      to: '/consumptions',
      search: (previous) => previous,
    });

  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Update Consumption
            <ConsumptionLimitWarning resourceId={consumption.resource.id} />
          </DialogTitle>
          <DialogDescription>Update this consumption.</DialogDescription>
        </DialogHeader>
        <ConsumptionUpdateForm initialData={consumption} onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}
