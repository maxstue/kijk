import type * as Api from '@kijk/api/generated/types';

import type { guideTopics } from './constants';

export type GuideProgress = Api.GuideResponse;
export type GuideTopic = (typeof guideTopics)[number]['id'];
export type GuideRequest = 'tour' | 'checklist' | GuideTopic;

export interface GuideContext {
  spaceId: string;
  request?: GuideRequest;
}

export interface GuideTask {
  id: GuideTopic;
  label: string;
  description: string;
  done: boolean;
}

export interface TourCapabilities {
  canView: boolean;
  canViewResources: boolean;
  canViewLimits: boolean;
  canRecord: boolean;
  canViewFinances: boolean;
  canImportFinances: boolean;
}

export type GuideDestination =
  | 'dashboard'
  | 'consumptions'
  | 'resources'
  | 'limits'
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'imports';
