import * as consumptionsOptions from '@kijk/api/consumptions/options';
import * as limitsOptions from '@kijk/api/limits/options';
import * as resourcesOptions from '@kijk/api/resources/options';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@kijk/ui/components/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { Driver } from 'driver.js';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { GUIDE_VERSION, type GuideTask } from './types';

interface Props {
  spaceId: string;
  request?: 'tour' | 'checklist';
  onRequestHandled?: () => void;
}

/** Nonblocking summary; Driver.js renders its expandable checklist and explanations. */
export function GuideCard({ spaceId, request, onRequestHandled }: Props) {
  const progress = useQuery(usersOptions.guideQueryOptions());
  const canRecord = useSpacePermission('consumptions:record');
  const canView = useSpacePermission('consumptions:view');
  const canConfigure = useSpacePermission('resources:configure');
  const canPlan = useSpacePermission('limits:plan');
  const resources = useQuery({ ...resourcesOptions.listQueryOptions(spaceId), enabled: canRecord || canPlan });
  const years = useQuery({ ...consumptionsOptions.yearsQueryOptions(spaceId), enabled: canView });
  const limits = useQuery({ ...limitsOptions.listQueryOptions(spaceId), enabled: canPlan });
  const update = useMutation(usersOptions.updateGuideMutationOptions());
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const driverRef = useRef<Driver | null>(null);
  const epoch = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const [driverError, setDriverError] = useState(false);
  const requested = useRef(false);
  const hasResources = resources.isSuccess && resources.data.length > 0;
  const canStartRecording = canRecord && resources.isSuccess && (hasResources || canConfigure);
  const canStartLimits = canPlan && resources.isSuccess && (hasResources || canConfigure);
  const hasExistingEntries = years.isSuccess && years.data.years.length > 0;
  const record = () => {
    if (hasResources) {
      void navigate({ to: '/$spaceId/consumptions', params: { spaceId }, search: { create: true } });
    } else {
      void navigate({ to: '/$spaceId/consumptions/resources', params: { spaceId }, search: { guideReturn: 'record' } });
    }
  };
  const plan = () => {
    if (hasResources) {
      void navigate({ to: '/$spaceId/consumptions/limits', params: { spaceId } });
    } else {
      void navigate({ to: '/$spaceId/consumptions/resources', params: { spaceId }, search: { guideReturn: 'limit' } });
    }
  };

  const stopGuide = useEffectEvent(() => {
    epoch.current++;
    requested.current = false;
    driverRef.current?.destroy();
    driverRef.current = null;
  });
  useEffect(() => () => stopGuide(), [spaceId, pathname]);

  async function open(kind: 'checklist' | 'tour' | 'dashboard') {
    driverRef.current?.destroy();
    const current = ++epoch.current;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDriverError(false);
    try {
      const module = await import('./driver');
      if (current !== epoch.current) {
        return;
      }
      const onDestroyed = () => {
        setExpanded(false);
        queueMicrotask(() => {
          if (returnFocus?.isConnected) {
            returnFocus.focus();
          }
        });
      };
      setExpanded(true);
      driverRef.current =
        kind === 'checklist'
          ? module.openChecklist(tasks, {
              onDestroyed,
              onTask: (id) => {
                if (id === 'record') {
                  record();
                }
                if (id === 'limit') {
                  plan();
                }
                if (id === 'dashboard') {
                  void open('dashboard');
                }
              },
            })
          : module.openWalkthrough({
              canRecord: canStartRecording,
              canPlanLimits: canStartLimits,
              dashboardOnly: kind === 'dashboard',
              onDestroyed,
              onDashboardExplained: () => update.mutate({ dashboardExplained: true }),
            });
    } catch {
      setDriverError(true);
    }
  }

  const tasks: GuideTask[] = [
    { id: 'setup', label: 'Setup completed', done: true },
    ...(canStartRecording
      ? [
          {
            id: 'record',
            label: progress.data?.guideFirstConsumptionAt
              ? 'First value recorded'
              : hasExistingEntries
                ? 'Entries already available in this space'
                : years.isSuccess
                  ? 'Record your first value'
                  : 'Record a value',
            done: Boolean(progress.data?.guideFirstConsumptionAt) || hasExistingEntries,
          },
        ]
      : []),
    {
      id: 'dashboard',
      label: 'Get to know the dashboard',
      done: Number(progress.data?.guideDashboardVersion ?? 0) >= GUIDE_VERSION,
    },
    ...(canStartLimits
      ? [
          {
            id: 'limit',
            label:
              limits.isSuccess && limits.data.length > 0
                ? 'Limits already available in this space'
                : limits.isSuccess
                  ? 'Create your first limit'
                  : 'Create a limit',
            done: limits.isSuccess && limits.data.length > 0,
            optional: true,
          },
        ]
      : []),
  ];
  const required = tasks.filter((task) => !task.optional);
  const completed = required.filter((task) => task.done).length;

  const openRequestedTour = useEffectEvent(() => {
    onRequestHandled?.();
    void open(request === 'checklist' ? 'checklist' : 'tour');
  });

  // A URL request is consumed before opening, so history/reloads do not automatically repeat the tour.
  useEffect(() => {
    if (!request || requested.current || !progress.isSuccess || ((canRecord || canPlan) && resources.isPending)) {
      return;
    }
    requested.current = true;
    openRequestedTour();
  }, [request, progress.isSuccess, resources.isPending, canRecord, canPlan]);

  if (progress.isPending) {
    return <p role='status'>Loading introduction…</p>;
  }
  if (progress.isError) {
    return (
      <p>
        Could not load introduction.{' '}
        <Button variant='link' onClick={() => void progress.refetch()}>
          Retry introduction
        </Button>
      </p>
    );
  }
  if (progress.data.guideHidden && !request) {
    return null;
  }

  return (
    <Card data-guide='checklist'>
      <CardHeader>
        <CardTitle>First steps with Kijk</CardTitle>
        <CardDescription>
          {completed} of {required.length} steps completed · Limits are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap items-center gap-3'>
        <Button variant='outline' aria-expanded={expanded} onClick={() => void open('checklist')}>
          Show checklist
        </Button>
        <Button variant='outline' onClick={() => void open('tour')}>
          Get to know Kijk
        </Button>
        {canStartRecording && (
          <Button data-guide='record' onClick={record}>
            Record a value
          </Button>
        )}
        {canStartLimits && (
          <Button data-guide='limits' variant='outline' onClick={plan}>
            Create a limit (optional)
          </Button>
        )}
        <Button variant='ghost' disabled={update.isPending} onClick={() => update.mutate({ hidden: true })}>
          Hide checklist
        </Button>
        {canRecord && resources.isSuccess && !hasResources && !canConfigure && (
          <p>Ask a space administrator to configure a resource before recording.</p>
        )}
        {(resources.isError || years.isError || limits.isError) && (
          <p>
            Some steps could not be checked.{' '}
            <Button
              variant='link'
              onClick={() => {
                if (canRecord || canPlan) {
                  void resources.refetch();
                }
                if (canView) {
                  void years.refetch();
                }
                if (canPlan) {
                  void limits.refetch();
                }
              }}
            >
              Retry steps
            </Button>
          </p>
        )}
        {update.isError && <p role='alert'>Could not save introduction progress. Please try again.</p>}
        {driverError && <p role='alert'>Could not open introduction. Please try again.</p>}
      </CardContent>
    </Card>
  );
}
