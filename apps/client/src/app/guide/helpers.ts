import type { TourCapabilities } from './tour-stops';
import type { GuideProgress, GuideTask } from './types';

/** All rows are subtours of the same guide version, in the same order as the full tour. */
export function getGuideTasks(progress: GuideProgress, capabilities: TourCapabilities): GuideTask[] {
  const done = new Set(
    Number(progress.guideCompletedVersion) === Number(progress.guideVersion) ? progress.guideCompletedSteps : [],
  );
  const tasks: GuideTask[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Periods, readings and your space overview.',
      done: done.has('dashboard'),
    },
  ];
  if (capabilities.canView) {
    tasks.push({
      id: 'consumptions',
      label: 'Consumptions',
      description: 'Find recorded values and learn how to add a reading.',
      done: done.has('consumptions'),
    });
  }
  if (capabilities.canViewResources) {
    tasks.push({
      id: 'resources',
      label: 'Resources',
      description: 'What you track, with units, colors and icons.',
      done: done.has('resources'),
    });
  }
  if (capabilities.canViewLimits) {
    tasks.push({
      id: 'limits',
      label: 'Limits',
      description: 'Compare consumption with optional thresholds.',
      done: done.has('limits'),
    });
  }
  if (capabilities.canViewFinances) {
    tasks.push({
      id: 'finances',
      label: 'Finances',
      description: 'Accounts, transactions, categories, budgets and available imports.',
      done: done.has('finances'),
    });
  }
  tasks.push({
    id: 'navigation',
    label: 'Spaces & settings',
    description: 'Switch spaces and find your account and space settings.',
    done: done.has('navigation'),
  });
  return tasks;
}
