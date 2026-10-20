import * as consumptionsOptions from '@kijk/api/consumptions/options';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { LimitWarning } from '@/app/consumptions/limit-warning';
import { ConsumptionUpdateForm } from '@/app/consumptions/update-form';
import { useSpaceId } from '@/shared/hooks/use-active-space';

/** `/consumptions/$consumptionId`: edit dialog of a consumption. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/_overview/$consumptionId')({
  component: ConsumptionEditDialog,
});

function ConsumptionEditDialog() {
  const spaceId = useSpaceId();
  const navigate = Route.useNavigate();
  const closeDialog = () =>
    navigate({
      params: { spaceId: spaceId },
      replace: true,
      to: '/$spaceId/consumptions',
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
  const spaceId = useSpaceId();
  const { consumptionId } = Route.useParams();
  const { year } = Route.useSearch();
  const { data: consumption } = useSuspenseQuery(consumptionsOptions.detailsQueryOptions(spaceId, consumptionId));
  const { data: consumptions } = useSuspenseQuery(consumptionsOptions.listQueryOptions(spaceId, year));
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
