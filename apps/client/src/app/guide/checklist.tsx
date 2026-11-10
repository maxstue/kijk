import { queryKeys } from '@kijk/api/query-keys';
import { hasSpacePermission } from '@kijk/api/spaces/permissions';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@kijk/ui/components/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { formatDateTime } from '@/shared/utils/format';

import { DriverChecklist } from './driver-checklist';
import { getGuideTasks } from './helpers';
import type { GuideContext, GuideProgress } from './types';
import { useGuideDriver } from './use-guide-driver';

interface Props extends GuideContext {
  progress: GuideProgress;
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
}

/** Every checklist row starts a subtour; the main button runs those same sections in order. */
export function GuideChecklist({ spaceId, request, progress, autoOpen = false, onAutoOpenHandled }: Props) {
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
  const update = useMutation(usersOptions.updateGuideMutationOptions());
  const { open, checklistOpen, setChecklistOpen, error } = useGuideDriver({
    spaceId,
    request,
    initiallyOpen: autoOpen,
    onOpen: () => update.reset(),
    onAutoOpenHandled,
    ...capabilities,
    onStepCompleted: async (step, completedTour) => {
      const saved = queryClient.getQueryData<GuideProgress>(queryKeys.users.guide);
      if (
        !completedTour &&
        saved &&
        Number(saved.guideCompletedVersion) === Number(saved.guideVersion) &&
        saved.guideCompletedSteps.includes(step)
      ) {
        return;
      }
      await update.mutateAsync({ completedStep: step, completedTour });
    },
  });
  const tasks = getGuideTasks(progress, capabilities);
  return (
    <Dialog
      open={checklistOpen || update.isError}
      onOpenChange={(next) => {
        setChecklistOpen(next);
        if (!next) {
          onAutoOpenHandled?.();
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
        <DriverChecklist
          tasks={tasks}
          onTask={(id) => {
            if (!update.isPending) {
              void open(id);
            }
          }}
        />
        <Button disabled={update.isPending} onClick={() => void open('tour')}>
          Get to know Kijk
        </Button>
        {!progress.guideCompletedAt && (
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground justify-self-center text-xs font-normal'
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { completedTour: true },
                {
                  onSuccess: () => {
                    onAutoOpenHandled?.();
                    setChecklistOpen(false);
                  },
                },
              )
            }
          >
            {update.isPending ? 'Saving…' : 'Skip'}
          </Button>
        )}
        {progress.guideCompletedAt && (
          <p className='text-muted-foreground text-center text-xs'>
            Tour last completed{' '}
            <time dateTime={progress.guideCompletedAt}>{formatDateTime(progress.guideCompletedAt)}</time>
          </p>
        )}
        {update.isError && <p role='alert'>Could not save introduction progress. Please try again.</p>}
        {error && !update.isError && (
          <p role='alert'>Could not continue the tour. Please reopen a section to try again.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
