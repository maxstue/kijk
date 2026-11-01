import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { Skeleton } from '@kijk/ui/components/skeleton';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
  size?: 'overview' | 'finance';
}

/** The section keeps the same footprint for loading, empty, failed and loaded data. */
export function Section({ title, description, pending, error, retry, children, size = 'overview' }: Props) {
  return (
    <section aria-label={title} className='flex min-w-0 flex-col gap-4'>
      <header className='flex h-16 flex-col gap-1'>
        <h2 className='text-base font-semibold tracking-tight'>{title}</h2>
        {description && <p className='text-muted-foreground text-sm'>{description}</p>}
      </header>
      <div
        className={`${size === 'finance' ? 'h-[480px] @xl/home:h-[370px]' : 'h-[540px]'} [scrollbar-gutter:stable] overflow-auto overscroll-contain`}
      >
        <div className='flex min-w-0 flex-col gap-5 pr-2'>
          {pending ? (
            <div role='status' className='flex flex-col gap-5'>
              <span className='sr-only'>Loading…</span>
              <div className='grid grid-cols-3 gap-4'>
                {[0, 1, 2].map((index) => (
                  <div key={index} className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-8 w-20' />
                  </div>
                ))}
              </div>
              <Skeleton className='h-60 w-full' />
            </div>
          ) : error ? (
            <Alert variant='destructive'>
              <AlertTitle>Could not load this section.</AlertTitle>
              <AlertDescription>
                <Button variant='outline' size='sm' onClick={retry}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  );
}
