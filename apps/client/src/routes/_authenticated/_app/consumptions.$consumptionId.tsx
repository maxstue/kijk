import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { LimitWarning } from '@/app/consumptions/limit-warning';
import { ConsumptionUpdateForm } from '@/app/consumptions/update-form';
import { consumptionQueryOptions, consumptionsByQueryOptions } from '@/shared/api/consumptions/options';

/** `/consumptions/$consumptionId`: edit dialog of a consumption. */
export const Route = createFileRoute('/_authenticated/_app/consumptions/$consumptionId')({
  component: ConsumptionEditDialog,
});

function ConsumptionEditDialog() {
  const navigate = Route.useNavigate();
  const closeDialog = () =>
    navigate({
      replace: true,
      to: '/consumptions',
      search: (previous) => previous,
    });

  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>
        <ConsumptionEditContent onClose={closeDialog} />
      </DialogContent>
    </Dialog>
  );
}

function ConsumptionEditContent({ onClose }: { onClose: () => void }) {
  const { consumptionId } = Route.useParams();
  const { year } = Route.useSearch();
  const { data: consumption } = useSuspenseQuery(consumptionQueryOptions(consumptionId));
  const { data: consumptions } = useSuspenseQuery(consumptionsByQueryOptions(year));
  return (
    <>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'>
          Update Consumption
          <LimitWarning resourceId={consumption.resource.id} />
        </DialogTitle>
        <DialogDescription>Update this consumption.</DialogDescription>
      </DialogHeader>
      <ConsumptionUpdateForm consumptions={consumptions} initialData={consumption} onClose={onClose} />
    </>
  );
}
