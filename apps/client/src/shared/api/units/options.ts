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

/** Query for all units visible to the user. */
export const unitsQueryOptions = (includeArchived = false) =>
  queryOptions({
    queryFn: ({ signal }) => getUnits(includeArchived, signal),
    queryKey: queryKeys.units.list(includeArchived),
  });

/** Query for the system units. */
export const systemUnitsQueryOptions = () =>
  queryOptions({ queryFn: ({ signal }) => getSystemUnits(signal), queryKey: queryKeys.units.system() });

/** Query for a page of personal or space units. */
export const unitPageQueryOptions = (
  scope: 'space' | 'personal',
  spaceId: string | undefined,
  page: number,
  pageSize: number,
  search: string,
) =>
  queryOptions({
    queryFn: ({ signal }) => getUnitPage(scope, spaceId, page, pageSize, search, signal),
    queryKey: queryKeys.units.page(scope, spaceId, page, pageSize, search),
  });

/** Mutation that creates a unit. */
export const createUnitMutationOptions = () =>
  mutationOptions({ mutationFn: (data: CreateUnitData) => createUnit(data) });

/** Mutation that updates a unit. */
export const updateUnitMutationOptions = () =>
  mutationOptions({ mutationFn: ({ data, id }: { data: UpdateUnitData; id: string }) => updateUnit(id, data) });

/** Mutation that archives or restores a unit. */
export const archiveUnitMutationOptions = () =>
  mutationOptions({ mutationFn: ({ id, restore }: { id: string; restore?: boolean }) => archiveUnit(id, restore) });

/** Mutation that deletes a unit. */
export const deleteUnitMutationOptions = () => mutationOptions({ mutationFn: (id: string) => deleteUnit(id) });

/** Mutation that shares a unit with a space. */
export const shareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => shareUnit(id, spaceId),
  });

/** Mutation that removes a unit from a space. */
export const unshareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => unshareUnit(id, spaceId),
  });
