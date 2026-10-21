import { useEffect } from 'react';
import { toast } from 'sonner';

/** A warning that is shown as toast while `active` is true. */
export interface WarningToast {
  /** A stable id; the toast is updated in place and dismissed once the warning is no longer active. */
  id: string;
  active: boolean;
  title: string;
  description: string;
}

/**
 * Shared warning logic for exceeded limits and budgets: shows a dismissible warning toast for every active warning and
 * dismisses it once the warning is resolved.
 */
export function useWarningToasts(warnings: WarningToast[]) {
  useEffect(() => {
    warnings.forEach((warning) => {
      if (!warning.active) {
        toast.dismiss(warning.id);
        return;
      }

      toast.warning(warning.title, {
        closeButton: true,
        description: warning.description,
        dismissible: true,
        duration: 5_000,
        id: warning.id,
      });
    });
  }, [warnings]);
}
