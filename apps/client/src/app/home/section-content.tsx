import { Alert, AlertDescription, AlertTitle } from '@kijk/ui/components/alert';
import { Button } from '@kijk/ui/components/button';
import { CardContent } from '@kijk/ui/components/card';
import { Skeleton } from '@kijk/ui/components/skeleton';
import type { ReactNode } from 'react';

interface DashboardSectionContentProps {
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
  size?: 'overview' | 'list' | 'finance';
}
/** Shared loading/error policy. Callers compose Card headers and actions directly. */
export function DashboardSectionContent({
  pending,
  error,
  retry,
  children,
  size = 'overview',
}: DashboardSectionContentProps) {
  return (
    <CardContent className={size === 'finance' ? 'min-h-28' : size === 'list' ? 'min-h-0' : 'min-h-[360px]'}>
      <div className='flex min-w-0 flex-col gap-5'>
        {pending ? (
          <div key='loading' role='status' className='flex flex-col gap-5'>
            <span className='sr-only'>Loading…</span>
            <div className='grid grid-cols-3 gap-4'>
              {[0, 1, 2].map((index) => (
                <div key={index} className='flex flex-col gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-8 w-20' />
                </div>
              ))}
            </div>
            {size !== 'finance' && <Skeleton className={size === 'list' ? 'h-48 w-full' : 'h-[280px] w-full'} />}
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
    </CardContent>
  );
}
