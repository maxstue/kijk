import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  cancelImportMutationOptions,
  categorizeImportMutationOptions,
  commitImportMutationOptions,
  confirmImportMappingMutationOptions,
  createImportMutationOptions,
  updateImportAiPreviewItemMutationOptions,
  updateImportCandidateMutationOptions,
} from '@/shared/api/imports/options';
import { queryKeys } from '@/shared/api/query-keys';
import { updateUserMutationOptions } from '@/shared/api/users/options';

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

/** Records the user's consent to processing sensitive data in bank exports and refreshes the current user. */
export function useGiveSensitiveDataConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateUserMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.imports.candidates(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.imports.aiPreview(id) }),
      ]);
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

/** Starts the AI categorization of an import and refreshes it and its rows. */
export function useCategorizeImport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...categorizeImportMutationOptions(id),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
    },
  });
}

/** Deselects or selects a text of the AI preview and refreshes the preview. */
export function useUpdateImportAiPreviewItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateImportAiPreviewItemMutationOptions(id),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.imports.aiPreview(id) });
    },
  });
}
