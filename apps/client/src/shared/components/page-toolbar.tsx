import { cn } from 'cn';
import type { ComponentProps } from 'react';

interface PageToolbarProps extends ComponentProps<'div'> {}
interface PageToolbarControlsProps extends ComponentProps<'div'> {}
interface PageToolbarActionsProps extends ComponentProps<'div'> {}

/** Shared responsive layout; callers compose controls and actions with ordinary UI components. */
function PageToolbar({ className, children, ...props }: PageToolbarProps) {
  return (
    <div data-slot='page-toolbar' className={cn('@container/toolbar', className)} {...props}>
      <div className='group/page-toolbar grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto]'>
        {children}
      </div>
    </div>
  );
}

function PageToolbarControls({ className, ...props }: PageToolbarControlsProps) {
  return (
    <div
      data-slot='page-toolbar-controls'
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-2 max-sm:group-has-data-[slot=page-toolbar-actions]/page-toolbar:row-start-2',
        className,
      )}
      {...props}
    />
  );
}

function PageToolbarActions({ className, ...props }: PageToolbarActionsProps) {
  return (
    <div
      data-slot='page-toolbar-actions'
      className={cn('col-start-1 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-2', className)}
      {...props}
    />
  );
}

export { PageToolbar, PageToolbarControls, PageToolbarActions };
