import * as React from 'react';

import { cn } from 'cn';
import { Button } from '@kijk/ui/components/button';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

/** Page navigation. */
function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role='navigation'
      aria-label='pagination'
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

/** List of pagination items. */
function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot='pagination-content' className={cn('flex items-center gap-1', className)} {...props} />;
}

/** A single pagination entry. */
function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot='pagination-item' {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

/** Link to a page; `isActive` marks the current page. */
function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <Button asChild variant={isActive ? 'outline' : 'ghost'} size={size} className={cn(className)}>
      <a aria-current={isActive ? 'page' : undefined} data-slot='pagination-link' data-active={isActive} {...props} />
    </Button>
  );
}

/** Link to the previous page. */
function PaginationPrevious({
  className,
  text = 'Previous',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink aria-label='Go to previous page' size='default' className={cn('pl-2!', className)} {...props}>
      <ChevronLeftIcon data-icon='inline-start' />
      <span className='hidden sm:block'>{text}</span>
    </PaginationLink>
  );
}

/** Link to the next page. */
function PaginationNext({
  className,
  text = 'Next',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink aria-label='Go to next page' size='default' className={cn('pr-2!', className)} {...props}>
      <span className='hidden sm:block'>{text}</span>
      <ChevronRightIcon data-icon='inline-end' />
    </PaginationLink>
  );
}

/** Placeholder for skipped pages. */
function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn("flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
