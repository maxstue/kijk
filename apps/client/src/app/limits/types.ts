import type { Limit } from '@kijk/api/limits/types';

export type LimitsView = 'list' | 'cards';
export type LimitAction = 'history' | 'edit' | 'delete';

export interface LimitSelection {
  id: string;
  action: LimitAction;
}

export interface LimitActionsProps {
  limit: Limit;
  canPlan: boolean;
  onAction: (selection: LimitSelection) => void;
}

export interface LimitsViewProps {
  limits: Limit[];
  canPlan: boolean;
  onAction: (selection: LimitSelection) => void;
}
