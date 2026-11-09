import type { components } from '@kijk/api/generated/kijk';

export type GuideProgress = components['schemas']['GuideResponse'];
export type GuideTopic = 'dashboard' | 'consumptions' | 'resources' | 'limits' | 'finances' | 'navigation';
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
