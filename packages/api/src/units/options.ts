import { invalidate } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { archiveUnit, createUnit, deleteUnit, getUnits, shareUnit, unshareUnit, updateUnit } from './requests';
import type { CreateUnitData, UnitListQuery, UpdateUnitData } from './types';

/** Query for the units of a scope, optionally filtered and paged. */
export const unitsQueryOptions = (query: UnitListQuery) =>
  queryOptions({ queryFn: ({ signal }) => getUnits(query, signal), queryKey: queryKeys.units.list(query) });

/** Mutation that creates a unit. */
export const createUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateUnitData) => createUnit(data),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.units.all),
  });

/** Mutation that updates a unit. */
export const updateUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateUnitData; id: string }) => updateUnit(id, data),
    // Resources and consumptions show unit names and symbols.
    onSuccess: (_data, _variables, _result, { client }) =>
      invalidate(client, queryKeys.units.all, queryKeys.resources.all, queryKeys.consumptions.all),
  });

/** Mutation that archives or restores a unit. */
export const archiveUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ id, restore }: { id: string; restore?: boolean }) => archiveUnit(id, restore),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.units.all),
  });

/** Mutation that deletes a unit. */
export const deleteUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteUnit(id),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.units.all),
  });

/** Mutation that shares a unit with a space. */
export const shareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => shareUnit(id, spaceId),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.units.all),
  });

/** Mutation that removes a unit from a space. */
export const unshareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => unshareUnit(id, spaceId),
    onSuccess: (_data, _variables, _result, { client }) => invalidate(client, queryKeys.units.all),
  });
