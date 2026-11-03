import { Button } from '@kijk/ui/components/button';
import { cn } from 'cn';
import { Plus } from 'lucide-react';
import type { ComponentProps } from 'react';

interface PageAddButtonProps extends Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'render'> {}

/** Primary create action shared by page toolbars. */
export function PageAddButton({ children, ...props }: PageAddButtonProps) {
  return (
    <Button {...props} variant='default' size='default'>
      <Plus /> {children}
    </Button>
  );
}

interface PageHeaderProps extends ComponentProps<'div'> {}
interface PageHeaderContentProps extends ComponentProps<'div'> {}
interface PageHeaderTitleProps extends ComponentProps<'h2'> {}
interface PageHeaderDescriptionProps extends ComponentProps<'p'> {}
interface PageHeaderActionsProps extends ComponentProps<'div'> {}

function PageHeader({ className, ...props }: PageHeaderProps) {
  return (
    <div
      data-slot='page-header'
      className={cn(
        'group/page-header grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]',
        className,
      )}
      {...props}
    />
  );
}
function PageHeaderContent({ className, ...props }: PageHeaderContentProps) {
  return (
    <div
      data-slot='page-header-content'
      className={cn(
        'min-w-0 space-y-1 max-sm:group-has-data-[slot=page-header-actions]/page-header:row-start-2',
        className,
      )}
      {...props}
    />
  );
}
function PageHeaderTitle({ className, children, ...props }: PageHeaderTitleProps) {
  return (
    <h2 data-slot='page-header-title' className={cn('text-lg font-semibold tracking-tight', className)} {...props}>
      {children}
    </h2>
  );
}
function PageHeaderDescription({ className, ...props }: PageHeaderDescriptionProps) {
  return (
    <p data-slot='page-header-description' className={cn('text-muted-foreground text-sm', className)} {...props} />
  );
}
function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return (
    <div
      data-slot='page-header-actions'
      className={cn('col-start-1 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-2', className)}
      {...props}
    />
  );
}
export { PageHeader, PageHeaderContent, PageHeaderTitle, PageHeaderDescription, PageHeaderActions };
