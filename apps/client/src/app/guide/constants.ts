import type { GuideDestination, TourCapabilities } from './types';

interface GuideTopicDefinition {
  id: string;
  label: string;
  description: string;
  destination: GuideDestination;
  capability?: keyof TourCapabilities;
}

/** Shared order, entry points and availability for the checklist and walkthrough. */
export const guideTopics = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Periods, readings and your space overview.',
    destination: 'dashboard',
  },
  {
    id: 'consumptions',
    label: 'Consumptions',
    description: 'Find recorded values and learn how to add a reading.',
    destination: 'consumptions',
    capability: 'canView',
  },
  {
    id: 'resources',
    label: 'Resources',
    description: 'What you track, with units, colors and icons.',
    destination: 'resources',
    capability: 'canViewResources',
  },
  {
    id: 'limits',
    label: 'Limits',
    description: 'Compare consumption with optional thresholds.',
    destination: 'limits',
    capability: 'canViewLimits',
  },
  {
    id: 'finances',
    label: 'Finances',
    description: 'Accounts, transactions, categories, budgets and available imports.',
    destination: 'accounts',
    capability: 'canViewFinances',
  },
  {
    id: 'navigation',
    label: 'Spaces & settings',
    description: 'Switch spaces and find your account and space settings.',
    destination: 'dashboard',
  },
] as const satisfies readonly GuideTopicDefinition[];

export function getAvailableGuideTopics(capabilities: TourCapabilities) {
  return guideTopics.filter((topic) => !('capability' in topic) || capabilities[topic.capability]);
}
