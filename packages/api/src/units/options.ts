import { invalidate, invalidateInEverySpace } from '@kijk/api/cache';
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
    onSuccess: (_data, { shareWithSpaceIds }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, ...(shareWithSpaceIds ?? []).map(queryKeys.units.inSpace)),
  });

/** Mutation that updates a unit. */
export const updateUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateUnitData; id: string }) => updateUnit(id, data),
    // Resources and consumptions of every space the unit is shared with show its name and symbol.
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([
        invalidate(client, queryKeys.units.all),
        invalidateInEverySpace(client, 'units', 'resources', 'consumptions', 'limits'),
      ]),
  });

/** Mutation that archives or restores a unit. */
export const archiveUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ id, restore }: { id: string; restore?: boolean }) => archiveUnit(id, restore),
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.units.all), invalidateInEverySpace(client, 'units')]),
  });

/** Mutation that deletes a unit. */
export const deleteUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => deleteUnit(id),
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.units.all), invalidateInEverySpace(client, 'units')]),
  });

/** Mutation that shares a unit with a space. */
export const shareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => shareUnit(id, spaceId),
    onSuccess: (_data, { spaceId }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, queryKeys.units.inSpace(spaceId)),
  });

/** Mutation that removes a unit from a space. */
export const unshareUnitMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => unshareUnit(id, spaceId),
    onSuccess: (_data, { spaceId }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, queryKeys.units.inSpace(spaceId)),
  });
