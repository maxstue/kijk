import { useEffect, useRef } from 'react';
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
  const previous = useRef(new Map<string, WarningToast>());
  useEffect(() => {
    const active = new Map(warnings.filter((warning) => warning.active).map((warning) => [warning.id, warning]));
    for (const id of previous.current.keys()) {
      if (!active.has(id)) {
        toast.dismiss(id);
      }
    }
    for (const warning of active.values()) {
      const old = previous.current.get(warning.id);
      if (old?.title === warning.title && old.description === warning.description) {
        continue;
      }
      toast.warning(warning.title, {
        closeButton: true,
        description: warning.description,
        dismissible: true,
        duration: 5_000,
        id: warning.id,
      });
    }
    previous.current = active;
  }, [warnings]);

  useEffect(
    () => () => {
      for (const id of previous.current.keys()) {
        toast.dismiss(id);
      }
      previous.current.clear();
    },
    [],
  );
}
