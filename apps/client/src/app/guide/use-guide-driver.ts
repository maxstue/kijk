import { useSidebar } from '@kijk/ui/components/sidebar';
import { useNavigate } from '@tanstack/react-router';
import type { Driver } from 'driver.js';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { TourCapabilities } from './tour-stops';
import type { GuideContext, GuideDestination, GuideRequest, GuideTopic } from './types';

// Keep the imperative tour and its styles outside the initial application bundle.
function loadDriver() {
  return import('./driver');
}

interface Options extends GuideContext, TourCapabilities {
  onStepCompleted: (step: GuideTopic) => Promise<void>;
}

/** Keeps a voluntary tour alive across its own route changes and tears it down when leaving its space. */
export function useGuideDriver({
  spaceId,
  request,
  canView,
  canViewResources,
  canViewLimits,
  canRecord,
  canViewFinances,
  canImportFinances,
  onStepCompleted,
}: Options) {
  const { setOpenMobile } = useSidebar();
  const navigate = useNavigate({ from: '/$spaceId' });
  const instance = useRef<Driver | null>(null);
  const epoch = useRef(0);
  const requested = useRef(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => () => {
      epoch.current++;
      instance.current?.destroy();
      instance.current = null;
    },
    [spaceId],
  );

  async function visit(destination: GuideDestination) {
    const params = { spaceId };
    switch (destination) {
      case 'dashboard':
        await navigate({ to: '/$spaceId', params });
        break;
      case 'consumptions':
        await navigate({ to: '/$spaceId/consumptions', params });
        break;
      case 'resources':
        await navigate({ to: '/$spaceId/consumptions/resources', params });
        break;
      case 'accounts':
        await navigate({ to: '/$spaceId/finances/accounts', params });
        break;
      case 'transactions':
        await navigate({ to: '/$spaceId/finances/transactions', params });
        break;
      case 'categories':
        await navigate({ to: '/$spaceId/finances/categories', params });
        break;
      case 'budgets':
        await navigate({ to: '/$spaceId/finances/budgets', params });
        break;
      case 'imports':
        await navigate({ to: '/$spaceId/finances/imports', params });
        break;
      case 'limits':
        await navigate({ to: '/$spaceId/consumptions/limits', params });
        break;
    }
  }

  async function open(kind: GuideRequest) {
    instance.current?.destroy();
    const current = ++epoch.current;
    setError(false);
    setChecklistOpen(kind === 'checklist');
    setOpenMobile(false);
    if (kind === 'checklist') {
      return;
    }
    const returnFocus = document.querySelector<HTMLButtonElement>('[data-guide="account"]');
    try {
      const module = await loadDriver();
      if (current !== epoch.current) {
        return;
      }
      const destinations: Record<GuideTopic, GuideDestination> = {
        dashboard: 'dashboard',
        consumptions: 'consumptions',
        resources: 'resources',
        limits: 'limits',
        finances: 'accounts',
        navigation: 'dashboard',
      };
      const available: Record<GuideTopic, boolean> = {
        dashboard: true,
        consumptions: canView,
        resources: canViewResources,
        limits: canViewLimits,
        finances: canViewFinances,
        navigation: true,
      };
      if (kind !== 'tour' && !available[kind]) {
        setError(true);
        setChecklistOpen(true);
        return;
      }
      await visit(kind === 'tour' ? 'dashboard' : destinations[kind]);
      if (current !== epoch.current) {
        return;
      }
      instance.current = module.openWalkthrough({
        canView,
        canViewResources,
        canViewLimits,
        canRecord,
        canViewFinances,
        canImportFinances,
        kind,
        onStepCompleted,
        onNavigate: visit,
        onError: () => {
          setError(true);
          setChecklistOpen(true);
        },
        onDestroyed: () => {
          epoch.current++;
          queueMicrotask(() => {
            if (returnFocus?.isConnected && returnFocus.getClientRects().length > 0) {
              returnFocus.focus();
            } else {
              document.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')?.focus();
            }
          });
        },
      });
    } catch {
      setError(true);
      setChecklistOpen(true);
    }
  }

  const openRequested = useEffectEvent(() => {
    void navigate({ replace: true, search: (previous) => ({ ...previous, introduction: undefined }) });
    void open(request ?? 'tour');
  });
  useEffect(() => {
    if (!request) {
      requested.current = false;
    } else if (!requested.current) {
      requested.current = true;
      openRequested();
    }
  }, [request]);

  return { open, checklistOpen, setChecklistOpen, error };
}
