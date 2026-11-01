import { Button } from '@kijk/ui/components/button';
import { Plus } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

/** Primary create action shared by page toolbars. */
export function PageAddButton({
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'render'>) {
  return (
    <Button {...props} variant='default' size='default'>
      <Plus /> {children}
    </Button>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
}

/** Compact heading for settings sections and detail pages. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className='grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]'>
      <div className={`min-w-0 space-y-1 ${actions ? 'row-start-2 sm:row-start-1' : ''}`}>
        <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      {actions && (
        <div className='col-start-1 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-2'>{actions}</div>
      )}
    </div>
  );
}

interface PageToolbarProps {
  children?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
}

/** Responsive row for tabs, filters and controls that change the current view. */
export function PageToolbar({ children, actions, tabs }: PageToolbarProps) {
  return (
    <div className='@container/toolbar'>
      <div className='grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto]'>
        {(tabs || children) && (
          <div className={`flex min-w-0 flex-wrap items-center gap-2 ${actions ? 'row-start-2 sm:row-start-1' : ''}`}>
            {tabs}
            {children}
          </div>
        )}
        {actions && (
          <div className='col-start-1 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-2'>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
