import { queryKeys } from '@kijk/api/query-keys';
import { hasSpacePermission } from '@kijk/api/spaces/permissions';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@kijk/ui/components/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DriverChecklist } from './driver-checklist';
import { getGuideTasks } from './helpers';
import type { GuideContext, GuideProgress } from './types';
import { useGuideDriver } from './use-guide-driver';

interface Props extends GuideContext {
  progress: GuideProgress;
}

/** Every checklist row starts a subtour; the main button runs those same sections in order. */
export function GuideChecklist({ spaceId, request, progress }: Props) {
  const { data: currentUser } = useQuery(usersOptions.meQueryOptions());
  const { data: features } = useQuery(usersOptions.featuresQueryOptions());
  const space = currentUser?.user?.spaces?.find((entry) => entry.id === spaceId);
  const capabilities = {
    canView: hasSpacePermission(space, 'consumptions:view'),
    canViewResources: hasSpacePermission(space, 'resources:view'),
    canViewLimits: hasSpacePermission(space, 'limits:view'),
    canRecord: hasSpacePermission(space, 'consumptions:record'),
    canViewFinances: features?.finances === true && hasSpacePermission(space, 'finances:view'),
    canImportFinances: features?.finances === true && hasSpacePermission(space, 'finances:import'),
  };
  const queryClient = useQueryClient();
  const update = useMutation({ ...usersOptions.updateGuideMutationOptions(), scope: { id: 'guide-progress' } });
  const { open, checklistOpen, setChecklistOpen, error } = useGuideDriver({
    spaceId,
    request,
    ...capabilities,
    onStepCompleted: async (step) => {
      const saved = queryClient.getQueryData<GuideProgress>(queryKeys.users.guide);
      if (
        saved &&
        Number(saved.guideCompletedVersion) === Number(saved.guideVersion) &&
        saved.guideCompletedSteps.includes(step)
      ) {
        return;
      }
      await update.mutateAsync({ completedStep: step });
    },
  });
  const tasks = getGuideTasks(progress, capabilities);
  return (
    <Dialog
      open={checklistOpen || update.isError}
      onOpenChange={(next) => {
        setChecklistOpen(next);
        if (!next) {
          update.reset();
        }
      }}
    >
      <DialogContent
        className='max-w-[calc(100vw-2rem)] gap-6 p-6 sm:max-w-2xl sm:p-8'
        finalFocus={() => {
          const account = document.querySelector<HTMLButtonElement>('[data-guide="account"]');
          return account?.getClientRects().length
            ? account
            : document.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]');
        }}
      >
        <DialogHeader>
          <DialogTitle className='text-xl'>Getting started</DialogTitle>
          <DialogDescription>
            Pick a section for a short tour, or choose Get to know Kijk to explore every available section.
          </DialogDescription>
        </DialogHeader>
        <DriverChecklist tasks={tasks} onTask={(id) => void open(id)} />
        <Button onClick={() => void open('tour')}>Get to know Kijk</Button>
        {update.isError && <p role='alert'>Could not save introduction progress. Please try again.</p>}
        {error && !update.isError && (
          <p role='alert'>Could not continue the tour. Please reopen a section to try again.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
