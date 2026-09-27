import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/shared/api/query-keys';

import {
  archiveUnit,
  createUnit,
  deleteUnit,
  getSystemUnits,
  getUnitPage,
  getUnits,
  shareUnit,
  unshareUnit,
  updateUnit,
} from './requests';
import type { CreateUnitData, UpdateUnitData } from './types';

export const unitsQueryOptions = (includeArchived = false) =>
  queryOptions({
    queryFn: ({ signal }) => getUnits(includeArchived, signal),
    queryKey: queryKeys.units.list(includeArchived),
  });

export const systemUnitsQueryOptions = () =>
  queryOptions({ queryFn: ({ signal }) => getSystemUnits(signal), queryKey: queryKeys.units.system() });

export const unitPageQueryOptions = (
  scope: 'household' | 'personal',
  householdId: string | undefined,
  page: number,
  pageSize: number,
  search: string,
) =>
  queryOptions({
    queryFn: ({ signal }) => getUnitPage(scope, householdId, page, pageSize, search, signal),
    queryKey: queryKeys.units.page(scope, householdId, page, pageSize, search),
  });

export const createUnitMutationOptions = () =>
  mutationOptions({ mutationFn: (data: CreateUnitData) => createUnit(data) });

export const updateUnitMutationOptions = () =>
  mutationOptions({ mutationFn: ({ data, id }: { data: UpdateUnitData; id: string }) => updateUnit(id, data) });

export const archiveUnitMutationOptions = () =>
  mutationOptions({ mutationFn: ({ id, restore }: { id: string; restore?: boolean }) => archiveUnit(id, restore) });

export const deleteUnitMutationOptions = () => mutationOptions({ mutationFn: (id: string) => deleteUnit(id) });

export const shareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ householdId, id }: { householdId: string; id: string }) => shareUnit(id, householdId),
  });

export const unshareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ householdId, id }: { householdId: string; id: string }) => unshareUnit(id, householdId),
  });
