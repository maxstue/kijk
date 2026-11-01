import { Button } from '@kijk/ui/components/button';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { cn } from 'cn';
import { useEffect, useRef } from 'react';

export interface ReviewActionProps {
  accountName: string;
  months: string;
  importedCount: number;
  hint: string;
  isPending: boolean;
  isSaving: boolean;
  cannotSave: boolean;
  onBack: () => void;
  onCommit: () => void;
}

interface ReviewActionsProps extends ReviewActionProps {
  floating?: boolean;
  onVisibilityChange?: (hidden: boolean) => void;
}

export function ReviewActions({
  accountName,
  months,
  importedCount,
  hint,
  isPending,
  isSaving,
  cannotSave,
  onBack,
  onCommit,
  floating = false,
  onVisibilityChange,
}: ReviewActionsProps) {
  const actions = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = actions.current;
    if (!element || !onVisibilityChange) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibilityChange(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 48));
      },
      { rootMargin: '-48px 0px 0px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisibilityChange]);
  return (
    <section
      ref={actions}
      role={floating ? 'toolbar' : undefined}
      aria-label={floating ? 'Import actions while scrolling' : 'Import actions'}
      className={cn(
        '@container flex flex-col gap-3',
        floating
          ? 'bg-popover sticky bottom-4 z-10 mx-auto w-full max-w-xl min-w-0 flex-wrap rounded-lg border p-2 shadow-lg @lg:flex-row @lg:items-center'
          : 'border-b pb-4',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1', floating && 'px-2')}>
        {floating && <p className='text-muted-foreground text-xs'>Step 4 of 5 · Review &amp; save</p>}
        <p className='text-sm font-medium' aria-live='polite'>
          {importedCount} transactions ready to import
        </p>
        <p className='text-muted-foreground truncate text-xs' title={`${accountName} · ${months}`}>
          {accountName} · {months}
        </p>
        {!floating && (
          <p className='text-muted-foreground min-h-12 text-sm' aria-live='polite'>
            {hint}
          </p>
        )}
      </div>
      <div className='flex shrink-0 justify-end gap-2'>
        <Button disabled={isPending} variant='outline' onClick={onBack}>
          Back
        </Button>
        <Button disabled={cannotSave} onClick={onCommit}>
          {isSaving && <SpinnerIcon className='animate-spin' data-icon='inline-start' />}
          {isSaving ? 'Starting import…' : 'Start import'}
        </Button>
      </div>
    </section>
  );
}
