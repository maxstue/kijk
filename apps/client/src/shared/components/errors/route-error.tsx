import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';

import { AppError } from '@/shared/components/errors/app-error';

/** Retries failed loaders and clears the Suspense query error state together. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const { reset } = useQueryErrorResetBoundary();
  function retry() {
    reset();
    void router.invalidate();
  }
  return <AppError error={error} onRetry={retry} />;
}
