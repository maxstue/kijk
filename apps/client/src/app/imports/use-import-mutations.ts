import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  cancelImportMutationOptions,
  commitImportMutationOptions,
  confirmImportMappingMutationOptions,
  createImportMutationOptions,
  updateImportCandidateMutationOptions,
  updateImportSettingsMutationOptions,
} from '@/shared/api/imports/options';
import { queryKeys } from '@/shared/api/query-keys';

/** Uploads a bank export and refreshes the import list. */
export function useCreateImport() {
  const queryClient = useQueryClient();
  return useMutation({
    ...createImportMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.list() });
    },
  });
}

/** Confirms the column mapping of an import and refreshes it. */
export function useConfirmImportMapping(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...confirmImportMappingMutationOptions(id),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
    },
  });
}

/** Changes a row during the review and refreshes the rows. */
export function useUpdateImportCandidate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateImportCandidateMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.candidates(id) });
    },
  });
}

/** Commits an import and refreshes imports, transactions and budget evaluations. */
export function useCommitImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...commitImportMutationOptions(id),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.imports.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
      ]);
    },
  });
}

/** Cancels an import and refreshes the imports. */
export function useCancelImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...cancelImportMutationOptions(id),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.all });
    },
  });
}

/** Changes the import settings and refreshes them. */
export function useUpdateImportSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateImportSettingsMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.settings() });
    },
  });
}
