import type { components } from '@/shared/api/generated/kijk';

export type ResourceData = components['schemas']['CreateResourceRequest'];
export type UpdateResourceRequest = components['schemas']['UpdateResourceRequest'];

export interface UpdateResourceData {
  id: string;
  resource: UpdateResourceRequest;
}
