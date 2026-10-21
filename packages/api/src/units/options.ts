import { invalidate, invalidateInEverySpace } from '@kijk/api/cache';
import { queryKeys } from '@kijk/api/query-keys';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { archive, restore, create, remove, list, shareWithSpace, removeFromSpace, update } from './requests';
import type { CreateUnitData, UnitListQuery, UpdateUnitData } from './types';

/** Query for the units of a scope, optionally filtered and paged. */
export const listQueryOptions = (query: UnitListQuery) =>
  queryOptions({ queryFn: ({ signal }) => list(query, signal), queryKey: queryKeys.units.list(query) });

/** Mutation that creates a unit. */
export const createMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: CreateUnitData) => create(data),
    onSuccess: (_data, { shareWithSpaceIds }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, ...(shareWithSpaceIds ?? []).map(queryKeys.units.inSpace)),
  });

/** Mutation that updates a unit. */
export const updateMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateUnitData; id: string }) => update(id, data),
    // Resources and consumptions of every space the unit is shared with show its name and symbol.
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([
        invalidate(client, queryKeys.units.all),
        invalidateInEverySpace(client, 'units', 'resources', 'consumptions', 'limits'),
      ]),
  });

/** Mutation that archives a unit. */
export const archiveMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => archive(id),
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.units.all), invalidateInEverySpace(client, 'units')]),
  });

/** Mutation that restores an archived unit. */
export const restoreMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => restore(id),
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.units.all), invalidateInEverySpace(client, 'units')]),
  });

/** Mutation that deletes a unit. */
export const deleteMutationOptions = () =>
  mutationOptions({
    mutationFn: (id: string) => remove(id),
    onSuccess: (_data, _variables, _result, { client }) =>
      Promise.all([invalidate(client, queryKeys.units.all), invalidateInEverySpace(client, 'units')]),
  });

/** Mutation that shares a unit with a space. */
export const shareWithSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => shareWithSpace(id, spaceId),
    onSuccess: (_data, { spaceId }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, queryKeys.units.inSpace(spaceId)),
  });

/** Mutation that removes a unit from a space. */
export const removeFromSpaceMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ spaceId, id }: { spaceId: string; id: string }) => removeFromSpace(id, spaceId),
    onSuccess: (_data, { spaceId }, _result, { client }) =>
      invalidate(client, queryKeys.units.all, queryKeys.units.inSpace(spaceId)),
  });
