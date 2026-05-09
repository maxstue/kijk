import type { components } from '@/shared/api/generated/kijk';

export type ResourceData = components['schemas']['CreateResourceRequest'];

export interface UpdateResourceData {
  id: string;
  resourceType: ResourceData;
}
